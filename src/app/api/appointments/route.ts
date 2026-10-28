import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  validateAppointmentInput,
  evaluateRateLimit,
} from "@/lib/appointments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Content-Type check: JSON only (otherwise 415)
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Unsupported Media Type. Content-Type must be application/json." },
        { status: 415, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2. Body size check: larger than 8 KB gets 413
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 8192) {
      return NextResponse.json(
        { error: "Payload too large." },
        { status: 413, headers: { "Cache-Control": "no-store" } }
      );
    }

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).length > 8192) {
      return NextResponse.json(
        { error: "Payload too large." },
        { status: 413, headers: { "Cache-Control": "no-store" } }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 3. Origin check: if Origin present and its host differs from request host -> 403
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        const originHost = new URL(origin).host.toLowerCase();
        const requestHost = (
          req.headers.get("x-forwarded-host") ||
          req.headers.get("host") ||
          ""
        ).toLowerCase();
        if (originHost !== requestHost) {
          return NextResponse.json(
            { error: "Cross-origin request forbidden." },
            { status: 403, headers: { "Cache-Control": "no-store" } }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid Origin header." },
          { status: 403, headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    // 4. Honeypot check: field "b_hp" must be empty
    if (body && typeof body === "object" && body.b_hp && String(body.b_hp).trim().length > 0) {
      return NextResponse.json(
        { ok: true },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 5. Validation using shared helper
    const validation = validateAppointmentInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 6. Duplicate check: same normalized phone + date + time in last 24 hours -> 409
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicate = await prisma.appointment.findFirst({
      where: {
        phone: validation.values.phone,
        appointmentDate: validation.values.date,
        appointmentTime: validation.values.time,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "You have already requested an appointment for this date and time. We will contact you soon.",
        },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 7. IP hashing & Rate limiting (rate limiting applies only when NODE_ENV is production)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "127.0.0.1";

    const secret = process.env.NEXTAUTH_SECRET;
    let ipHash: string | null = null;
    if (secret) {
      ipHash = crypto.createHmac("sha256", secret).update(clientIp).digest("hex");
    } else {
      console.warn(
        "[appointments] NEXTAUTH_SECRET is missing; ipHash will be stored as null."
      );
    }

    if (process.env.NODE_ENV === "production") {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [ipHour, ipDay, phoneDay, globalHour] = await Promise.all([
        ipHash
          ? prisma.appointment.count({
              where: { ipHash, createdAt: { gte: oneHourAgo } },
            })
          : 0,
        ipHash
          ? prisma.appointment.count({
              where: { ipHash, createdAt: { gte: oneDayAgo } },
            })
          : 0,
        prisma.appointment.count({
          where: {
            phone: validation.values.phone,
            createdAt: { gte: oneDayAgo },
          },
        }),
        prisma.appointment.count({
          where: { createdAt: { gte: oneHourAgo } },
        }),
      ]);

      const rateLimitResult = evaluateRateLimit({
        ipHour,
        ipDay,
        phoneDay,
        globalHour,
      });

      if (rateLimitResult.limited) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimitResult.retryAfterSeconds || 3600),
              "Cache-Control": "no-store",
            },
          }
        );
      }
    }

    // 8. Create the appointment row
    await prisma.appointment.create({
      data: {
        name: validation.values.name,
        phone: validation.values.phone,
        appointmentDate: validation.values.date,
        appointmentTime: validation.values.time,
        message: validation.values.message,
        ipHash,
      },
    });

    return NextResponse.json(
      { ok: true },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("[POST /api/appointments] Unexpected error:", error);
    return NextResponse.json(
      { error: "Could not send your request. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
