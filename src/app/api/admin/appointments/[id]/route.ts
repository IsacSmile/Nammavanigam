import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized. Admin role required." },
      { status: 403 }
    );
  }

  try {
    const params = await Promise.resolve(props.params);
    const id = Number(params.id);

    if (!Number.isInteger(id) || isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Appointment ID must be an integer." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body || {};

    if (status !== "pending" && status !== "handled") {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending' or 'handled'." },
        { status: 400 }
      );
    }

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Appointment not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        phone: true,
        appointmentDate: true,
        appointmentTime: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, appointment: updated });
  } catch (error: any) {
    console.error("[PATCH /api/admin/appointments/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update appointment status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized. Admin role required." },
      { status: 403 }
    );
  }

  try {
    const params = await Promise.resolve(props.params);
    const id = Number(params.id);

    if (!Number.isInteger(id) || isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Appointment ID must be an integer." },
        { status: 400 }
      );
    }

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Appointment not found." },
        { status: 404 }
      );
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[DELETE /api/admin/appointments/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment." },
      { status: 500 }
    );
  }
}
