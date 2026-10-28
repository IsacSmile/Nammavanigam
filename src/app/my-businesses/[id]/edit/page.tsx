"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2,
  FolderTree,
  FileText,
  MapPin,
  PhoneCall,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  UploadCloud,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Globe,
  Mail,
  MessageSquare,
  Home,
  ArrowLeft,
  Lock,
  Pencil,
  XCircle,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import CustomSelect from "@/components/CustomSelect";
import { getLocationSelectGroups, RawLocationItem } from "@/lib/location-options";
import AdditionalPhonesInput, { PhoneRow } from "@/components/AdditionalPhonesInput";
import SocialLinksInput from "@/components/SocialLinksInput";
import {
  validatePhone,
  validateAdditionalPhones,
  normalizeSocialUrl,
  SOCIAL_PLATFORMS,
  SocialPlatform,
  PLATFORM_META,
} from "@/lib/contact";

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

interface LocationItem {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

interface ServiceItem {
  id?: number;
  serviceName: string;
  description: string;
  price: string;
  imageUrl?: string;
}

interface DayHour {
  day: string;
  openingTime: string;
  closingTime: string;
  closed: boolean;
}

const DEFAULT_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params?.id as string;

  const { data: session, status: authStatus } = useSession();

  // Loading & Permission States
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);

  // Data Sources
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  // Original Status (preserved)
  const [businessStatus, setBusinessStatus] = useState<string>("pending");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string>("");

  // Form State
  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  // Step 2: Description & Services
  const [description, setDescription] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([
    { serviceName: "", description: "", price: "", imageUrl: "" },
  ]);
  const [uploadingServiceIdx, setUploadingServiceIdx] = useState<number | null>(null);
  const [serviceImageErrors, setServiceImageErrors] = useState<{ [index: number]: string }>({});

  // Step 3: Address & Location
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Step 4: Contact Info
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [additionalPhones, setAdditionalPhones] = useState<PhoneRow[]>([]);
  const [socialLinks, setSocialLinks] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [phoneFieldErrors, setPhoneFieldErrors] = useState<{ [index: number]: { number?: string; label?: string } }>({});
  const [socialFieldErrors, setSocialFieldErrors] = useState<Partial<Record<SocialPlatform, string>>>({});

  // Step 5: Business Hours
  const [businessHours, setBusinessHours] = useState<DayHour[]>(
    DEFAULT_DAYS.map((day) => ({
      day,
      openingTime: day === "Sunday" ? "" : "09:00",
      closingTime: day === "Sunday" ? "" : "18:00",
      closed: day === "Sunday",
    }))
  );

  // Step 6: Logo & Photos Upload
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Banner State
  const [liveBannerUrl, setLiveBannerUrl] = useState<string | null>(null);
  const [isLiveBannerRemoved, setIsLiveBannerRemoved] = useState(false);
  const [showLiveRemoveConfirm, setShowLiveRemoveConfirm] = useState(false);
  const [pendingBannerUrl, setPendingBannerUrl] = useState<string | null>(null);
  const [bannerStatus, setBannerStatus] = useState<string>("none");
  const [bannerRejectionReason, setBannerRejectionReason] = useState<string | null>(null);
  const [newPendingBannerUrl, setNewPendingBannerUrl] = useState<string | null>(null);
  const [isPendingRemoved, setIsPendingRemoved] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Form Submission & Status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    businessId: number;
    name: string;
    status: string;
    slug: string;
  } | null>(null);

  // Validation Error state for current step
  const [stepError, setStepError] = useState<string | null>(null);

  // Load Categories, Locations, and Business Data
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/my-businesses/${businessId}/edit`);
      return;
    }

    if (authStatus !== "authenticated" || !businessId) return;

    async function loadAllData() {
      setLoadingBusiness(true);
      setAccessDenied(false);
      setNotFound(false);
      setInitialError(null);

      try {
        const [catRes, locRes, bizRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/locations"),
          fetch(`/api/businesses/${businessId}`),
        ]);

        if (catRes.ok) {
          setCategories(await catRes.json());
        }
        if (locRes.ok) {
          setLocations(await locRes.json());
        }

        if (bizRes.status === 403) {
          setAccessDenied(true);
          return;
        }

        if (bizRes.status === 404) {
          setNotFound(true);
          return;
        }

        if (!bizRes.ok) {
          const errData = await bizRes.json();
          throw new Error(errData.error || "Failed to load business details.");
        }

        const biz = await bizRes.json();

        // Populate Form Fields
        setName(biz.name || "");
        setCategoryId(biz.categoryId ? String(biz.categoryId) : "");
        setBusinessStatus(biz.status || "pending");
        setRejectionReason(biz.rejectionReason || null);
        setBusinessSlug(biz.slug || "");

        setDescription(biz.description || "");

        // Services
        if (Array.isArray(biz.businessServices) && biz.businessServices.length > 0) {
          setServices(
            biz.businessServices.map((s: any) => ({
              id: s.id,
              serviceName: s.serviceName || "",
              description: s.description || "",
              price: s.price !== null && s.price !== undefined ? String(s.price) : "",
              imageUrl: s.imageUrl || "",
            }))
          );
        } else {
          setServices([{ serviceName: "", description: "", price: "", imageUrl: "" }]);
        }

        // Location & Address
        setLocationId(biz.locationId ? String(biz.locationId) : "");
        if (biz.address) {
          const parts = biz.address.split(",").map((p: string) => p.trim());
          if (parts.length >= 3) {
            setStreet(parts.slice(0, parts.length - 2).join(", "));
            setArea(parts[parts.length - 2]);
            setPincode(parts[parts.length - 1]);
          } else if (parts.length === 2) {
            setStreet(parts[0]);
            setArea(parts[1]);
            setPincode("");
          } else {
            setStreet(biz.address);
            setArea("");
            setPincode("");
          }
        } else {
          setStreet("");
          setArea("");
          setPincode("");
        }

        setLatitude(biz.latitude !== null && biz.latitude !== undefined ? String(biz.latitude) : "");
        setLongitude(biz.longitude !== null && biz.longitude !== undefined ? String(biz.longitude) : "");

        // Contact Info
        setPhone(biz.phone || "");
        setWhatsapp(biz.whatsapp || "");
        setEmail(biz.email || "");
        setWebsite(biz.website || "");

        // Additional Phones
        if (Array.isArray(biz.businessPhones)) {
          setAdditionalPhones(
            biz.businessPhones.map((p: any) => ({
              number: p.number || "",
              label: p.label || "",
            }))
          );
        } else {
          setAdditionalPhones([]);
        }

        // Social Media Links
        const initialSocials: Partial<Record<SocialPlatform, string>> = {};
        if (Array.isArray(biz.businessSocialLinks)) {
          for (const s of biz.businessSocialLinks) {
            if (s.platform && s.url) {
              const platformKey = s.platform.toLowerCase() as SocialPlatform;
              if (SOCIAL_PLATFORMS.includes(platformKey)) {
                initialSocials[platformKey] = s.url;
              }
            }
          }
        }
        setSocialLinks(initialSocials);

        // Business Hours
        if (Array.isArray(biz.businessHours) && biz.businessHours.length > 0) {
          const loadedHours = DEFAULT_DAYS.map((dayName) => {
            const match = biz.businessHours.find(
              (h: any) => h.day.toLowerCase() === dayName.toLowerCase()
            );
            if (match) {
              return {
                day: dayName,
                openingTime: match.openingTime || "",
                closingTime: match.closingTime || "",
                closed: Boolean(match.closed),
              };
            }
            return {
              day: dayName,
              openingTime: dayName === "Sunday" ? "" : "09:00",
              closingTime: dayName === "Sunday" ? "" : "18:00",
              closed: dayName === "Sunday",
            };
          });
          setBusinessHours(loadedHours);
        }

        // Logo & Photos
        if (Array.isArray(biz.businessPhotos) && biz.businessPhotos.length > 0) {
          // Photo with sortOrder === 0 is Logo
          const logoObj = biz.businessPhotos.find(
            (p: any) => p.sortOrder === 0 || (p.altText && p.altText.toLowerCase().includes("logo"))
          );
          if (logoObj) {
            setLogoUrl(logoObj.imageUrl);
          } else {
            setLogoUrl("");
          }

          // Gallery photos (sortOrder > 0 or not logo)
          const galleryObjs = biz.businessPhotos.filter(
            (p: any) => p !== logoObj && p.sortOrder !== 0
          );
          setPhotoUrls(galleryObjs.map((p: any) => p.imageUrl));
        } else {
          setLogoUrl("");
          setPhotoUrls([]);
        }

        // Banner population
        setLiveBannerUrl(biz.bannerUrl || null);
        setPendingBannerUrl(biz.bannerPendingUrl || null);
        setBannerStatus(biz.bannerStatus || "none");
        setBannerRejectionReason(biz.bannerRejectionReason || null);
        setNewPendingBannerUrl(null);
        setIsPendingRemoved(false);
      } catch (err: any) {
        setInitialError(err.message || "Failed to fetch business data.");
      } finally {
        setLoadingBusiness(false);
      }
    }

    loadAllData();
  }, [authStatus, businessId, router]);

  // Service Actions
  const handleAddService = () => {
    setServices([...services, { serviceName: "", description: "", price: "", imageUrl: "" }]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
    setServiceImageErrors((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleServiceChange = (
    index: number,
    field: "serviceName" | "description" | "price" | "imageUrl",
    value: string
  ) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const handleServiceImageUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Clear previous error for this service
    setServiceImageErrors((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });

    // 1. File type validation (JPG, PNG, WebP)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setServiceImageErrors((prev) => ({
        ...prev,
        [index]: "Invalid format. Only JPG, PNG, and WebP images are supported.",
      }));
      return;
    }

    // 2. File size validation (Max 3 MB)
    const maxSizeBytes = 3 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setServiceImageErrors((prev) => ({
        ...prev,
        [index]: "Image exceeds 3 MB limit. Please select a smaller image.",
      }));
      return;
    }

    // 3. Image dimension validation (Minimum 400 x 400)
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width < 400 || img.height < 400) {
        setServiceImageErrors((prev) => ({
          ...prev,
          [index]: `Image too small (${img.width}×${img.height}px). Minimum required is 400×400px.`,
        }));
        return;
      }

      // 4. Upload via /api/upload
      try {
        setUploadingServiceIdx(index);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Failed to upload image.");
        }

        handleServiceChange(index, "imageUrl", data.url);
      } catch (err: any) {
        setServiceImageErrors((prev) => ({
          ...prev,
          [index]: err.message || "Failed to upload service image.",
        }));
      } finally {
        setUploadingServiceIdx(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setServiceImageErrors((prev) => ({
        ...prev,
        [index]: "Failed to read image file. Please choose a valid image.",
      }));
    };

    img.src = objectUrl;
  };

  // Hours Actions
  const handleHourChange = (
    index: number,
    field: keyof DayHour,
    value: any
  ) => {
    const updated = [...businessHours];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessHours(updated);
  };

  // Upload Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setLogoError(null);
    setStepError(null);

    // 1. File type validation (JPG, PNG, WebP)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      const msg = "Invalid format. Only JPG, PNG, and WebP images are supported.";
      setLogoError(msg);
      setStepError(msg);
      return;
    }

    // 2. File size validation (Max 4 MB)
    const maxSizeBytes = 4 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const msg = `That photo is ${sizeMb} MB. Please choose one under 4 MB.`;
      setLogoError(msg);
      setStepError(msg);
      return;
    }

    setUploadingLogo(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload logo.");
      }
      setLogoUrl(data.url);
    } catch (err: any) {
      const msg = err.message || "Logo upload failed.";
      setLogoError(msg);
      setStepError(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  const checkImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to inspect banner image dimensions."));
      };
      img.src = objectUrl;
    });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const file = files[0];
    setBannerError(null);
    setStepError(null);

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      const msg = "Invalid format. Only JPG, PNG, and WebP images are supported.";
      setBannerError(msg);
      setStepError(msg);
      return;
    }

    const maxSizeBytes = 4 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const msg = `That banner is ${sizeMb} MB. Please choose one under 4 MB.`;
      setBannerError(msg);
      setStepError(msg);
      return;
    }

    try {
      const dims = await checkImageDimensions(file);
      if (dims.width < 1200 || dims.height < 450) {
        const msg = `Banner image is too small (${dims.width} × ${dims.height} px). Minimum required size is 1200 × 450 px.`;
        setBannerError(msg);
        setStepError(msg);
        return;
      }
    } catch (err: any) {
      const msg = err.message || "Failed to inspect banner image.";
      setBannerError(msg);
      setStepError(msg);
      return;
    }

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload banner.");
      }
      setNewPendingBannerUrl(data.url);
      setIsPendingRemoved(false);
      setBannerError(null);
    } catch (err: any) {
      const msg = err.message || "Banner upload failed.";
      setBannerError(msg);
      setStepError(msg);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setPhotoError(null);
    setStepError(null);

    if (photoUrls.length + files.length > 8) {
      const msg = "Maximum 8 gallery photos allowed.";
      setPhotoError(msg);
      setStepError(msg);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 4 * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        const msg =
          files.length === 1
            ? "Invalid format. Only JPG, PNG, and WebP images are supported."
            : `"${file.name}" has an invalid format. Only JPG, PNG, and WebP images are supported.`;
        setPhotoError(msg);
        setStepError(msg);
        return;
      }

      if (file.size > maxSizeBytes) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const msg =
          files.length === 1
            ? `That photo is ${sizeMb} MB. Please choose one under 4 MB.`
            : `That photo "${file.name}" is ${sizeMb} MB. Please choose one under 4 MB.`;
        setPhotoError(msg);
        setStepError(msg);
        return;
      }
    }

    setUploadingPhoto(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        } else {
          throw new Error(data.error || `Failed to upload "${file.name}".`);
        }
      }
      setPhotoUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      const msg = err.message || "Failed to upload photo(s).";
      setPhotoError(msg);
      setStepError(msg);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
    setPhotoError(null);
  };

  // Step Validation & Navigation
  const validateStep = (step: number): boolean => {
    setStepError(null);

    if (step === 1) {
      if (!name.trim()) {
        setStepError("Business Name is required.");
        return false;
      }
      if (!categoryId) {
        setStepError("Please select a Category.");
        return false;
      }
    }

    if (step === 3) {
      if (!locationId) {
        setStepError("Please select a Location.");
        return false;
      }
    }

    if (step === 4) {
      if (!phone.trim() && !email.trim()) {
        setStepError("Please provide at least a Phone number or Email address.");
        return false;
      }

      if (phone.trim()) {
        const pVal = validatePhone(phone);
        if (!pVal.valid) {
          setStepError(pVal.error || "Invalid primary phone number.");
          return false;
        }
      }

      // Validate additional phones
      const newPhoneErrors: { [index: number]: { number?: string; label?: string } } = {};
      let hasPhoneError = false;

      for (let i = 0; i < additionalPhones.length; i++) {
        const row = additionalPhones[i];
        if (!row.number.trim()) {
          newPhoneErrors[i] = { number: "Phone number is required." };
          hasPhoneError = true;
        } else {
          const v = validatePhone(row.number);
          if (!v.valid) {
            newPhoneErrors[i] = { number: v.error };
            hasPhoneError = true;
          }
        }
        if (row.label && row.label.trim().length > 30) {
          newPhoneErrors[i] = { ...newPhoneErrors[i], label: "Label cannot exceed 30 characters." };
          hasPhoneError = true;
        }
      }

      const dupVal = validateAdditionalPhones(additionalPhones, phone);
      if (!dupVal.valid) {
        hasPhoneError = true;
        setStepError(dupVal.error || "Please fix errors in additional phone numbers.");
      }
      setPhoneFieldErrors(newPhoneErrors);
      if (hasPhoneError) return false;

      // Validate social links
      const newSocialErrors: Partial<Record<SocialPlatform, string>> = {};
      let hasSocialError = false;

      for (const p of SOCIAL_PLATFORMS) {
        const raw = socialLinks[p];
        if (raw && raw.trim()) {
          const norm = normalizeSocialUrl(p, raw);
          if (!norm.success) {
            newSocialErrors[p] = norm.error;
            hasSocialError = true;
          }
        }
      }

      setSocialFieldErrors(newSocialErrors);
      if (hasSocialError) {
        setStepError("Please fix invalid social media links before proceeding.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    }
  };

  const handleBack = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Update Submission
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      name,
      categoryId: Number(categoryId),
      locationId: Number(locationId),
      description,
      street,
      area,
      pincode,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      phone,
      whatsapp,
      email,
      website,
      additionalPhones: additionalPhones
        .filter((p) => p.number.trim().length > 0)
        .map((p) => ({ number: p.number.trim(), label: p.label.trim() || null })),
      socialLinks: SOCIAL_PLATFORMS
        .filter((p) => socialLinks[p] && socialLinks[p]!.trim().length > 0)
        .map((p) => {
          const norm = normalizeSocialUrl(p, socialLinks[p]!.trim());
          return { platform: p, url: norm.success && norm.url ? norm.url : socialLinks[p]!.trim() };
        }),
      services: services.filter((s) => s.serviceName.trim().length > 0),
      businessHours,
      logoUrl,
      photoUrls,
      ...(isLiveBannerRemoved ? { removeBanner: true } : {}),
      ...(newPendingBannerUrl
        ? { bannerPendingUrl: newPendingBannerUrl }
        : isPendingRemoved
        ? { bannerPendingUrl: null }
        : {}),
    };

    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update business.");
      }

      setSubmittedResult({
        businessId: data.businessId,
        name: data.name,
        status: data.status,
        slug: data.slug || businessSlug,
      });
      setCurrentStep(8); // Confirmation step
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred while updating.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === Number(categoryId));
  const selectedLocationObj = locations.find((l) => l.id === Number(locationId));
  const districts = locations.filter((l) => !l.parentId);
  const locationSelectGroups = getLocationSelectGroups(locations);

  const STEPS_NAV = [
    { id: 1, label: "Basic Info", icon: Building2 },
    { id: 2, label: "Description & Services", icon: FileText },
    { id: 3, label: "Location & Address", icon: MapPin },
    { id: 4, label: "Contact Info", icon: PhoneCall },
    { id: 5, label: "Business Hours", icon: Clock },
    { id: 6, label: "Logo & Photos", icon: ImageIcon },
    { id: 7, label: "Review & Submit", icon: CheckCircle2 },
  ];

  if (authStatus === "loading" || loadingBusiness) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-xs text-slate-500 font-semibold space-y-3 flex-col">
        <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
        <p>Loading business details for editing...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
        <Header />
        <div className="max-w-lg mx-auto p-6 sm:p-12 my-12 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Access Denied
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              You must be the owner of this business listing or an administrator to access the edit page.
            </p>
          </div>
          <Link
            href="/my-businesses"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-navy hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to My Businesses
          </Link>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
        <Header />
        <div className="max-w-lg mx-auto p-6 sm:p-12 my-12 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Business Not Found
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              The requested business listing does not exist or has been removed.
            </p>
          </div>
          <Link
            href="/my-businesses"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-navy hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Businesses
          </Link>
        </div>
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
        <Header />
        <div className="max-w-lg mx-auto p-6 sm:p-12 my-12 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              Failed to Load Business
            </h1>
            <p className="text-xs text-rose-600 font-medium">{initialError}</p>
          </div>
          <Link
            href="/my-businesses"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-navy hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Businesses
          </Link>
        </div>
      </div>
    );
  }

  // STEP 8: Success / Confirmation Screen
  if (submittedResult && currentStep === 8) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          {/* Animated Success Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-white shadow-md">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
          </div>

          {/* Heading & Status Banner */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold shadow-2xs">
              {submittedResult.status === "approved" && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Listing Status: Approved & Active
                </span>
              )}
              {submittedResult.status === "pending" && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Listing Status: Pending Admin Review
                </span>
              )}
              {submittedResult.status === "rejected" && (
                <span className="bg-rose-50 text-rose-800 border border-rose-200/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Listing Status: Rejected
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Business Updated!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              Changes to <strong className="text-slate-900 font-extrabold">{submittedResult.name}</strong> have been saved successfully.
            </p>
          </div>

          {/* Listing Details Card */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-left text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <span className="text-slate-500 font-semibold">Listing ID:</span>
              <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                #{submittedResult.businessId}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <span className="text-slate-500 font-semibold">Business Name:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[200px]">
                {submittedResult.name}
              </span>
            </div>

            <div className="flex items-center justify-between pb-0.5">
              <span className="text-slate-500 font-semibold">Status Preserved:</span>
              <span className="font-bold capitalize text-slate-800">
                {submittedResult.status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            {submittedResult.status === "approved" && (
              <Link
                href={`/business/${submittedResult.slug}`}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}

            <Link
              href="/my-businesses"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Return to My Business Listings</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-brand-navy font-sans pb-16">
      <Header />
      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/my-businesses"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-navy transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Back to My Businesses</span>
              </Link>

              <span className="text-slate-300 text-xs font-light select-none">|</span>

              <span className="px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px] uppercase tracking-wide border border-amber-200">
                Edit Listing #{businessId}
              </span>
            </div>
            <h1 className="text-2xl font-black text-brand-navy mt-1 flex items-center gap-2">
              <Pencil className="w-6 h-6 text-brand-green" />
              Edit Business Listing
            </h1>
            <p className="text-xs text-slate-500">
              Update information, contact details, operating hours, and photo gallery for <strong>{name || "this business"}</strong>.
            </p>
          </div>

          <Link
            href="/my-businesses"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand-navy font-semibold px-3 py-1.5 bg-slate-100 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            My Listings
          </Link>
        </div>

        {/* Current Status Notification Banner */}
        {businessStatus === "rejected" && rejectionReason && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-rose-900 text-sm">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              Rejection Reason from Admin:
            </span>
            <p className="pl-5 leading-relaxed font-medium text-rose-700">{rejectionReason}</p>
            <p className="pl-5 text-[11px] text-slate-500 pt-1">
              You can update the fields below and submit your corrections.
            </p>
          </div>
        )}

        {/* Progress Stepper Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          {/* Mobile Stepper Header (< sm) */}
          <div className="block sm:hidden space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5 text-brand-green">
                <span className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center text-[10px] font-extrabold">
                  {currentStep}
                </span>
                <span>Step {currentStep} of 7: <strong className="text-slate-900">{STEPS_NAV[currentStep - 1]?.label}</strong></span>
              </span>
              <span className="text-slate-500 font-extrabold">{Math.round((currentStep / 7) * 100)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              />
            </div>

            {/* Scrollable Step Chips on Mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {STEPS_NAV.map((step) => {
                const IconComp = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                      isActive
                        ? "bg-brand-navy text-white shadow-xs"
                        : isCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200/60"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="whitespace-nowrap">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Stepper Bar (>= sm) */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            {STEPS_NAV.map((step) => {
              const IconComp = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className="flex flex-col items-center gap-1.5 flex-1 relative cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted
                        ? "bg-brand-green text-white shadow-xs"
                        : isActive
                        ? "bg-brand-navy text-white ring-4 ring-brand-navy/10 shadow-xs"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <IconComp className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold text-center whitespace-nowrap tracking-tight ${
                      isActive
                        ? "text-brand-navy font-extrabold"
                        : isCompleted
                        ? "text-brand-green"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {stepError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{stepError}</span>
          </div>
        )}

        {submitError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Step Container Card */}
        <div className="bg-brand-card p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-green" />
                  Step 1: Basic Business Information
                </h2>
                <p className="text-xs text-slate-500">
                  Update your official business name and main category.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Business Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chennai Digital Solutions"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs font-medium"
                  />
                </div>

                <CustomSelect
                  label="Primary Category"
                  required
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  placeholder="-- Select Category --"
                  icon={<FolderTree className="w-4 h-4" />}
                  options={categories.map((cat) => ({
                    value: String(cat.id),
                    label: cat.name,
                  }))}
                  searchable
                />
              </div>
            </div>
          )}

          {/* STEP 2: Description & Services */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-green" />
                  Step 2: Description & Offered Services
                </h2>
                <p className="text-xs text-slate-500">
                  Update overview of your business and manage individual services or products.
                </p>
              </div>

              <div className="space-y-5 text-xs">
                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Business Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your products, services, specialization, and unique selling points..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-brand-navy">
                      Services / Products Offered
                    </label>
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Service Row
                    </button>
                  </div>

                  <div className="space-y-3">
                    {services.map((srv, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Service #{idx + 1}
                          </span>
                          {services.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveService(idx)}
                              className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={srv.serviceName}
                              onChange={(e) =>
                                handleServiceChange(idx, "serviceName", e.target.value)
                              }
                              placeholder="Service Name (e.g. Web Development)"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={srv.price}
                              onChange={(e) =>
                                handleServiceChange(idx, "price", e.target.value)
                              }
                              placeholder="Price (₹ optional)"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={srv.description}
                            onChange={(e) =>
                              handleServiceChange(idx, "description", e.target.value)
                            }
                            placeholder="Short description of this service (optional)"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-600"
                          />
                        </div>

                        {/* Optional Service Image Picker */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            {srv.imageUrl ? (
                              <div className="relative group/thumb shrink-0">
                                <img
                                  src={srv.imageUrl}
                                  alt={srv.serviceName || "Service"}
                                  width={56}
                                  height={56}
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleServiceChange(idx, "imageUrl", "")}
                                  className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-sm transition-colors"
                                  title="Remove service image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <label
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-brand-green bg-slate-50 hover:bg-emerald-50/40 text-slate-600 hover:text-brand-green text-xs font-medium cursor-pointer transition-colors ${
                                  uploadingServiceIdx === idx
                                    ? "opacity-60 pointer-events-none"
                                    : ""
                                }`}
                              >
                                {uploadingServiceIdx === idx ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-green" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <UploadCloud className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-green" />
                                    <span>Add Service Image</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  disabled={uploadingServiceIdx === idx}
                                  onChange={(e) => handleServiceImageUpload(idx, e)}
                                />
                              </label>
                            )}

                            {srv.imageUrl && (
                              <button
                                type="button"
                                onClick={() => handleServiceChange(idx, "imageUrl", "")}
                                className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove image
                              </button>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            <span className="font-medium text-slate-500">Square works best</span>
                            <span className="hidden sm:inline"> · </span>
                            <span className="block sm:inline">JPG, PNG, WebP · Max 3 MB · Min 400×400</span>
                          </div>
                        </div>

                        {serviceImageErrors[idx] && (
                          <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {serviceImageErrors[idx]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Address & Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-green" />
                  Step 3: Physical Address & Location
                </h2>
                <p className="text-xs text-slate-500">
                  Update location area and detailed address.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-brand-navy mb-1.5 text-xs">
                    Location <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green cursor-pointer shadow-2xs"
                    >
                      <option value="" disabled>Select your location</option>
                      {locationSelectGroups.map((group) => (
                        <optgroup key={group.districtId} label={group.districtName}>
                          {group.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-brand-navy mb-1">
                      Street Address / Building Name
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. 2nd Floor, Grand Tower, MG Road"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-navy mb-1">
                      Area / Suburb
                    </label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Ernakulam South"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 682016"
                    className="w-full sm:w-1/2 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-navy">
                      GPS Coordinates (Optional)
                    </span>
                    <span className="text-[11px] text-slate-400">Skippable</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g. 9.9312"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g. 76.2673"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Contact Info */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-brand-green" />
                  Step 4: Contact Details & Online Links
                </h2>
                <p className="text-xs text-slate-500">
                  Update customer contact channels.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Additional Phone Numbers */}
                <AdditionalPhonesInput
                  phones={additionalPhones}
                  onChange={(updated) => {
                    setAdditionalPhones(updated);
                    setPhoneFieldErrors({});
                  }}
                  errors={phoneFieldErrors}
                />

                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Business Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@business.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Website URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.yourbusiness.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Social Media Links */}
                <SocialLinksInput
                  values={socialLinks}
                  onChange={(platform, val) => {
                    setSocialLinks((prev) => ({ ...prev, [platform]: val }));
                    setSocialFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy[platform];
                      return copy;
                    });
                  }}
                  errors={socialFieldErrors}
                />
              </div>
            </div>
          )}

          {/* STEP 5: Business Hours */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-green" />
                  Step 5: Business Operating Hours
                </h2>
                <p className="text-xs text-slate-500">
                  Update opening and closing times or toggle days closed.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {businessHours.map((h, idx) => (
                  <div
                    key={h.day}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="w-28 font-bold text-brand-navy text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                      {h.day}
                    </div>

                    <div className="flex items-center gap-3 flex-1">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={h.closed}
                          onChange={(e) =>
                            handleHourChange(idx, "closed", e.target.checked)
                          }
                          className="rounded text-brand-green focus:ring-brand-green w-4 h-4"
                        />
                        <span className={h.closed ? "text-rose-600 font-bold" : "text-slate-600"}>
                          Closed
                        </span>
                      </label>

                      {!h.closed && (
                        <div className="flex items-center gap-2 text-xs">
                          <input
                            type="time"
                            value={h.openingTime}
                            onChange={(e) =>
                              handleHourChange(idx, "openingTime", e.target.value)
                            }
                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="time"
                            value={h.closingTime}
                            onChange={(e) =>
                              handleHourChange(idx, "closingTime", e.target.value)
                            }
                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Logo & Photos Upload */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-brand-green" />
                  Step 6: Logo & Gallery Photos
                </h2>
                <p className="text-xs text-slate-500">
                  Keep existing photos, upload new ones, remove photos, or replace the logo.
                </p>
              </div>

              <div className="space-y-6 text-xs">
                {/* Logo Section */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <label className="block font-bold text-brand-navy">
                    Business Logo
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {logoUrl ? (
                      <div className="relative group w-20 h-20 border border-slate-200 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl("");
                            setLogoError(null);
                          }}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Logo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 bg-slate-50 shrink-0">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}

                    <div className="w-full sm:w-auto">
                      <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs">
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading Logo...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{logoUrl ? "Replace Logo File" : "Choose Logo File"}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Recommended size: 400x400px (PNG, JPG, WEBP · Max 4 MB)
                      </p>
                      {logoError && (
                        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {logoError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner Section (Optional) */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                  <div>
                    <label className="block font-bold text-brand-navy">
                      Business Hero Banner <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      Recommended 1600 x 600 px. JPG, PNG or WebP, max 4 MB. On phones the sides are cropped, so keep logos and text in the middle two-thirds.
                    </p>
                  </div>

                  {bannerError && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {bannerError}
                    </p>
                  )}

                  {/* 1. Live Banner Display */}
                  {liveBannerUrl && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                            <span>Live Banner</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Live on profile
                            </span>
                          </span>
                          {!isLiveBannerRemoved && (
                            <button
                              type="button"
                              onClick={() => setShowLiveRemoveConfirm(true)}
                              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Remove banner
                            </button>
                          )}
                        </div>
                        {isLiveBannerRemoved && (
                          <span className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                            <span>Banner will be removed when you save</span>
                            <button
                              type="button"
                              onClick={() => setIsLiveBannerRemoved(false)}
                              className="text-brand-blue font-bold underline hover:text-brand-blue-hover cursor-pointer ml-1"
                            >
                              Undo
                            </button>
                          </span>
                        )}
                      </div>
                      {!isLiveBannerRemoved && (
                        <div className="relative aspect-[16/6] max-h-32 w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <img
                            src={liveBannerUrl}
                            alt="Live Banner"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reason Note (shown whenever banner_rejection_reason is set, cleared by new upload) */}
                  {bannerRejectionReason && !newPendingBannerUrl && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-800">
                      <span className="font-bold flex items-center gap-1 text-rose-900">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Removed by admin:
                      </span>
                      <p className="pl-4 leading-relaxed font-medium text-rose-700">
                        {bannerRejectionReason}
                      </p>
                      <p className="pl-4 text-[11px] text-slate-500 pt-0.5">
                        Please upload a revised banner adhering to our guidelines.
                      </p>
                    </div>
                  )}

                  {/* 2. Pending Banner Display (either newly uploaded or existing pending) */}
                  {(newPendingBannerUrl || (pendingBannerUrl && !isPendingRemoved)) ? (
                    <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <span>Pending Banner</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending review
                          </span>
                        </span>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-brand-blue hover:underline cursor-pointer">
                            <span>Replace Pending Banner</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleBannerUpload}
                              disabled={uploadingBanner}
                              className="hidden"
                            />
                          </label>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewPendingBannerUrl(null);
                              setIsPendingRemoved(true);
                              setBannerError(null);
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            Remove Pending Banner
                          </button>
                        </div>
                      </div>

                      {/* Desktop and Mobile Crop Previews */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            Desktop Hero Preview (~1600 × 600 px crop)
                          </span>
                          <div className="relative aspect-[16/6] w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img
                              src={newPendingBannerUrl || pendingBannerUrl!}
                              alt="Pending Banner Desktop Preview"
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            Mobile Hero Preview (16:9 crop)
                          </span>
                          <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img
                              src={newPendingBannerUrl || pendingBannerUrl!}
                              alt="Pending Banner Mobile Preview"
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 3. No active pending banner: show upload button */
                    <div className="space-y-3">
                      <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs">
                        {uploadingBanner ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading Banner...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>
                              {liveBannerUrl && !isLiveBannerRemoved
                                ? "Upload New Replacement Banner"
                                : bannerStatus === "rejected"
                                ? "Upload New Banner"
                                : "Choose Banner File"}
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleBannerUpload}
                          disabled={uploadingBanner}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Gallery Photos Section */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <label className="block font-bold text-brand-navy">
                        Gallery Showcase Photos
                      </label>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Upload up to 8 photos showcasing your storefront, products, or team ({photoUrls.length}/8 uploaded)
                      </p>
                    </div>

                    {photoUrls.length < 8 && (
                      <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                        <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0 border border-slate-200/80">
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New Photos</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                            className="hidden"
                          />
                        </label>
                        {photoError && (
                          <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {photoError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photoUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-square border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                      >
                        <img
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove photo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}

                    {photoUrls.length === 0 && (
                      <div className="col-span-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 space-y-1">
                        <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold">No gallery photos uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Preview & Submit */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-green" />
                  Step 7: Review & Save Changes
                </h2>
                <p className="text-xs text-slate-500">
                  Review all modified details carefully before saving updates.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Basic & Location Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-brand-navy text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-brand-green" />
                      {name || "Untitled Business"}
                    </span>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-brand-blue hover:underline text-[11px] font-bold"
                    >
                      Edit Basic Info
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Category:</span>
                      <span className="font-semibold text-brand-navy">
                        {selectedCategoryObj?.name || "None Selected"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Location:</span>
                      <span className="font-semibold text-brand-navy">
                        {selectedLocationObj
                          ? `${selectedLocationObj.name}${
                              districts.find((d) => d.id === selectedLocationObj.parentId)
                                ? `, ${districts.find((d) => d.id === selectedLocationObj.parentId)?.name}`
                                : ""
                            }`
                          : "None Selected"}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Address:</span>
                      <span className="font-medium text-slate-800">
                        {[street, area, pincode].filter(Boolean).join(", ") || "No street address provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description & Services */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-brand-navy flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-green" />
                      Description & Services ({services.filter((s) => s.serviceName).length} services)
                    </span>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-brand-blue hover:underline text-[11px] font-bold"
                    >
                      Edit Services
                    </button>
                  </div>
                  <p className="text-slate-700 italic">
                    {description || "No description provided."}
                  </p>
                  {services.filter((s) => s.serviceName).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {services
                        .filter((s) => s.serviceName)
                        .map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-brand-navy"
                          >
                            {s.serviceName} {s.price ? `(₹${s.price})` : ""}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-brand-navy flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-brand-green" />
                      Contact Details
                    </span>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="text-brand-blue hover:underline text-[11px] font-bold"
                    >
                      Edit Contact
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div>Phone: <strong className="text-brand-navy">{phone || "N/A"}</strong></div>
                    <div>WhatsApp: <strong className="text-brand-navy">{whatsapp || "N/A"}</strong></div>
                    <div>Email: <strong className="text-brand-navy">{email || "N/A"}</strong></div>
                    <div>Website: <strong className="text-brand-navy">{website || "N/A"}</strong></div>
                  </div>

                  {/* Additional Phones in Review */}
                  {additionalPhones.some((p) => p.number.trim()) && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block text-[11px] mb-1 font-semibold">Additional Phone Numbers:</span>
                      <div className="flex flex-wrap gap-2">
                        {additionalPhones
                          .filter((p) => p.number.trim())
                          .map((p, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-brand-navy"
                            >
                              {p.number} {p.label ? `(${p.label})` : ""}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links in Review */}
                  {SOCIAL_PLATFORMS.some((p) => socialLinks[p]?.trim()) && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block text-[11px] mb-1 font-semibold">Social Media Links:</span>
                      <div className="flex flex-wrap gap-2">
                        {SOCIAL_PLATFORMS.filter((p) => socialLinks[p]?.trim()).map((p) => (
                          <span
                            key={p}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-brand-navy flex items-center gap-1.5"
                          >
                            <span className="font-semibold">{PLATFORM_META[p].label}:</span>{" "}
                            <span className="text-slate-600 truncate max-w-xs">{socialLinks[p]}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Preview */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-brand-navy flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-brand-green" />
                      Media Attachments (Logo + {photoUrls.length} photos)
                    </span>
                    <button
                      onClick={() => setCurrentStep(6)}
                      className="text-brand-blue hover:underline text-[11px] font-bold"
                    >
                      Edit Photos
                    </button>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {logoUrl && (
                      <div className="text-center shrink-0">
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="w-14 h-14 object-cover rounded border border-brand-green"
                        />
                        <span className="text-[10px] text-brand-green font-bold block mt-0.5">Logo</span>
                      </div>
                    )}
                    {photoUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="w-14 h-14 object-cover rounded border border-slate-200 shrink-0"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Controls Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between pt-6 border-t border-slate-200 gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200/80 active:scale-[0.99]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div className="hidden sm:block"></div>
            )}

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto px-7 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Changes & Update Listing</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Live Banner Removal Confirmation Modal */}
      {showLiveRemoveConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-brand-navy">Remove banner</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Remove your banner? Your page will go back to the default header. You can upload a new banner any time.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLiveRemoveConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLiveBannerRemoved(true);
                  setShowLiveRemoveConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Remove banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
