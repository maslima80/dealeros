"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  DollarSign,
  BarChart3,
  FileText,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Pencil,
  Copy,
  Gauge,
  Fuel,
  Cog,
  StickyNote,
  Tag,
  TrendingUp,
  Package,
  CheckCircle2,
  Truck,
  ShoppingCart,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Home,
  Inbox,
  Search,
  Settings,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui";
import {
  updateVehicleNotesAction,
  updateVehicleStatusAction,
  updateVehicleVisibilityAction,
  updateVehicleDetailsAction,
  updateVehicleFeaturesAction,
  updateVehicleCustomFeaturesAction,
} from "../actions";

// Types
type VehicleStatus = "purchased" | "recon" | "ready" | "listed" | "sold";

type Photo = {
  id: string;
  url: string;
  position: number;
  isCover: boolean;
};

type Cost = {
  id: string;
  amountCents: number;
  vendor: string | null;
  note: string | null;
  receiptUrl: string | null;
  costDate: Date | null;
  createdAt: Date;
};

type Sale = {
  id: string;
  saleDate: string | null;
  salePriceCents: number | null;
  buyerFullName: string | null;
  pdfUrl: string | null;
} | null;

type ListingPayload = {
  headline: string;
  description: string;
  specsText: string;
  publicVehicleUrl: string;
  hasPhotos: boolean;
} | null;

type Vehicle = {
  id: string;
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyStyle: string | null;
  drivetrain: string | null;
  transmission: string | null;
  engine: string | null;
  fuelType: string | null;
  doors: number | null;
  seats: number | null;
  odometerKm: number | null;
  mileageUnit: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  stockNumber: string | null;
  status: VehicleStatus;
  isPublic: boolean;
  notes: string | null;
  purchasePriceCents: number | null;
  askingPriceCents: number | null;
  hasSunroof: boolean;
  hasNavigation: boolean;
  hasBackupCamera: boolean;
  hasParkingSensors: boolean;
  hasBlindSpotMonitor: boolean;
  hasHeatedSeats: boolean;
  hasRemoteStart: boolean;
  hasAppleCarplay: boolean;
  hasAndroidAuto: boolean;
  hasBluetooth: boolean;
  hasLeather: boolean;
  hasThirdRow: boolean;
  hasTowPackage: boolean;
  hasAlloyWheels: boolean;
  customFeatures: string[];
  equipmentRaw: string[] | null;
};

type VehiclePageV2Props = {
  vehicle: Vehicle;
  photos: Photo[];
  costs: Cost[];
  additionalCostsCents: number;
  sale: Sale;
  listingPayload: ListingPayload;
  marketSnapshotComponent: React.ReactNode;
  photosComponent: React.ReactNode;
  costsComponent: React.ReactNode;
  listingKitComponent: React.ReactNode;
  saleComponent: React.ReactNode;
};

// Constants
const STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string; icon: React.ElementType; bgColor: string }> = {
  purchased: { label: "Purchased", color: "text-blue-700", icon: ShoppingCart, bgColor: "bg-blue-50" },
  recon: { label: "In Recon", color: "text-amber-700", icon: Cog, bgColor: "bg-amber-50" },
  ready: { label: "Ready", color: "text-emerald-700", icon: CheckCircle2, bgColor: "bg-emerald-50" },
  listed: { label: "Listed", color: "text-purple-700", icon: Tag, bgColor: "bg-purple-50" },
  sold: { label: "Sold", color: "text-zinc-700", icon: BadgeCheck, bgColor: "bg-zinc-100" },
};

const TABS = [
  { id: "overview", label: "Overview", icon: Car },
  { id: "pricing", label: "Pricing & Costs", icon: DollarSign },
  { id: "market", label: "Market Analysis", icon: BarChart3 },
  { id: "listing", label: "Listing Kit", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

const FEATURE_FLAGS = [
  { key: "hasSunroof", label: "Sunroof" },
  { key: "hasNavigation", label: "Navigation" },
  { key: "hasBackupCamera", label: "Backup Camera" },
  { key: "hasParkingSensors", label: "Parking Sensors" },
  { key: "hasBlindSpotMonitor", label: "Blind Spot Monitor" },
  { key: "hasHeatedSeats", label: "Heated Seats" },
  { key: "hasRemoteStart", label: "Remote Start" },
  { key: "hasAppleCarplay", label: "Apple CarPlay" },
  { key: "hasAndroidAuto", label: "Android Auto" },
  { key: "hasBluetooth", label: "Bluetooth" },
  { key: "hasLeather", label: "Leather Interior" },
  { key: "hasThirdRow", label: "Third Row Seating" },
  { key: "hasTowPackage", label: "Tow Package" },
  { key: "hasAlloyWheels", label: "Alloy Wheels" },
] as const;

const BODY_STYLE_OPTIONS = ["Sedan", "SUV", "Crossover", "Coupe", "Hatchback", "Wagon", "Pickup", "Van", "Convertible"];
const DRIVETRAIN_OPTIONS = ["FWD", "RWD", "AWD", "4WD"];
const TRANSMISSION_OPTIONS = ["Automatic", "Manual", "CVT", "Dual-Clutch Automatic"];
const FUEL_TYPE_OPTIONS = ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric", "Flex Fuel"];

// Utility functions
function formatCurrency(cents: number | null): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatNumber(num: number | null): string {
  if (num === null) return "—";
  return num.toLocaleString();
}

// Navigation items for dropdown
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Vehicles", href: "/dashboard/vehicles", icon: Car },
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox },
  { label: "Sourcing", href: "/dashboard/sourcing", icon: Search },
  { label: "Settings", href: "/dashboard/settings/dealer", icon: Settings },
];

// ============================================================================
// Navigation Dropdown
// ============================================================================

function NavigationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all text-sm font-medium text-zinc-700"
      >
        <Menu className="w-4 h-4" />
        <span className="hidden sm:inline">Navigate</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Photo Gallery - Full Width with Thumbnails
// ============================================================================

function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.isCover) return -1;
    if (b.isCover) return 1;
    return a.position - b.position;
  });

  const nextPhoto = () => {
    if (sortedPhotos.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % sortedPhotos.length);
    }
  };

  const prevPhoto = () => {
    if (sortedPhotos.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    }
  };

  if (sortedPhotos.length === 0) {
    return (
      <div className="aspect-[16/9] md:aspect-[21/9] bg-zinc-100 rounded-2xl flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <Car className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No photos yet</p>
          <p className="text-xs mt-1">Add photos in the Overview tab</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Main Image */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] bg-zinc-900 rounded-2xl overflow-hidden group">
          <Image
            src={sortedPhotos[currentIndex].url}
            alt={title}
            fill
            className="object-contain"
            priority
          />
          
          {/* Navigation Arrows */}
          {sortedPhotos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Photo Counter & Fullscreen */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full font-medium">
              {currentIndex + 1} / {sortedPhotos.length}
            </span>
            <button
              onClick={() => setIsFullscreen(true)}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {sortedPhotos.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sortedPhotos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden transition-all ${
                  idx === currentIndex
                    ? "ring-2 ring-zinc-900 ring-offset-2"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={photo.url}
                  alt={`${title} - ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Image
              src={sortedPhotos[currentIndex].url}
              alt={title}
              fill
              className="object-contain"
            />
          </div>

          {sortedPhotos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {sortedPhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-white w-8" : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Vehicle Info Card
// ============================================================================

function VehicleInfoCard({
  vehicle,
  status,
  isPublic,
  onStatusChange,
  onVisibilityToggle,
}: {
  vehicle: Vehicle;
  status: VehicleStatus;
  isPublic: boolean;
  onStatusChange: (status: VehicleStatus) => void;
  onVisibilityToggle: () => void;
}) {
  const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const subtitle = vehicle.trim || "";
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-zinc-200 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
        {/* Left: Title & Key Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900">
              {title || "Untitled Vehicle"}
            </h1>
            <div className={`flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${statusConfig.color}`} />
              <span className={`text-xs sm:text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          {subtitle && (
            <p className="text-base sm:text-lg text-zinc-500 mb-3 sm:mb-4">{subtitle}</p>
          )}

          {/* Key Specs */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <SpecBadge icon={Gauge} label="Odometer" value={vehicle.odometerKm ? `${formatNumber(vehicle.odometerKm)} ${vehicle.mileageUnit?.toLowerCase() || "km"}` : "—"} />
            <SpecBadge icon={Cog} label="Transmission" value={vehicle.transmission || "—"} />
            <SpecBadge icon={Fuel} label="Fuel" value={vehicle.fuelType || "—"} />
            <SpecBadge icon={Truck} label="Drivetrain" value={vehicle.drivetrain || "—"} />
          </div>

          {/* VIN */}
          <div className="flex items-center gap-2 sm:gap-3 bg-zinc-50 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider">VIN</p>
              <p className="font-mono text-xs sm:text-sm text-zinc-700 truncate">{vehicle.vin}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(vehicle.vin)}
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors flex-shrink-0"
              title="Copy VIN"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Pricing & Actions */}
        <div className="lg:text-right space-y-4">
          <div className="flex flex-row lg:flex-col gap-4">
            <div className="flex-1 lg:flex-none">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Purchase Price</p>
              <p className="text-xl font-bold text-zinc-900">
                {formatCurrency(vehicle.purchasePriceCents)}
              </p>
            </div>
            <div className="flex-1 lg:flex-none bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
              <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Asking Price</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(vehicle.askingPriceCents)}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 lg:justify-end">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as VehicleStatus)}
              className="h-10 px-4 rounded-lg bg-zinc-100 text-zinc-700 text-sm border-0 focus:ring-2 focus:ring-zinc-900/10 cursor-pointer"
            >
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <button
              onClick={onVisibilityToggle}
              className={`h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                isPublic
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isPublic ? "Public" : "Hidden"}
            </button>
          </div>

          {/* Stock Number */}
          {vehicle.stockNumber && (
            <p className="text-sm text-zinc-400">
              Stock # <span className="font-medium text-zinc-600">{vehicle.stockNumber}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-zinc-400 truncate">{label}</p>
        <p className="text-xs sm:text-sm font-medium text-zinc-900 truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Tab Navigation
// ============================================================================

function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div className="border-b border-zinc-200 bg-white rounded-t-xl sm:rounded-t-2xl">
      <nav className="flex overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-zinc-900 text-zinc-900 bg-zinc-50/50"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({
  vehicle,
  photosComponent,
  notes,
  onNotesChange,
  onSaveNotes,
  hasNotesChanged,
  isPending,
  onEditDetails,
  onFeatureToggle,
  features,
  customFeatures,
  onAddCustomFeature,
  onRemoveCustomFeature,
}: {
  vehicle: Vehicle;
  photosComponent: React.ReactNode;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
  hasNotesChanged: boolean;
  isPending: boolean;
  onEditDetails: () => void;
  onFeatureToggle: (key: string) => void;
  features: Record<string, boolean>;
  customFeatures: string[];
  onAddCustomFeature: (feature: string) => void;
  onRemoveCustomFeature: (feature: string) => void;
}) {
  const [newFeature, setNewFeature] = useState("");
  const [isNotesExpanded, setIsNotesExpanded] = useState(!!vehicle.notes);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Internal Notes - Collapsible */}
      <section className="bg-amber-50/50 rounded-xl border border-amber-100">
        <button
          onClick={() => setIsNotesExpanded(!isNotesExpanded)}
          className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <StickyNote className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-medium text-zinc-900 text-sm sm:text-base">Internal Notes</span>
            {vehicle.notes && !isNotesExpanded && (
              <span className="text-xs sm:text-sm text-zinc-500 truncate hidden sm:inline">
                — {vehicle.notes.slice(0, 30)}...
              </span>
            )}
          </div>
          {isNotesExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
          )}
        </button>
        {isNotesExpanded && (
          <div className="px-3 sm:px-5 pb-3 sm:pb-5">
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add internal notes about this vehicle..."
              className="w-full min-h-[80px] sm:min-h-[100px] p-3 rounded-lg border border-amber-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
            />
            {hasNotesChanged && (
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={onSaveNotes}
                  disabled={isPending}
                  isLoading={isPending}
                  size="sm"
                >
                  Save Notes
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Photos Section */}
      <section>
        <SectionHeader title="Photos" subtitle="Manage vehicle photos" />
        <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-6">
          {photosComponent}
        </div>
      </section>

      {/* Vehicle Details */}
      <section>
        <SectionHeader
          title="Vehicle Details"
          subtitle="Core specifications"
          action={
            <button
              onClick={onEditDetails}
              className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 font-medium"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          }
        />
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
            <DetailGroup title="Basic Info">
              <DetailItem label="Year" value={vehicle.year} />
              <DetailItem label="Make" value={vehicle.make} />
              <DetailItem label="Model" value={vehicle.model} />
              <DetailItem label="Trim" value={vehicle.trim} />
              <DetailItem label="Body Style" value={vehicle.bodyStyle} />
            </DetailGroup>
            <DetailGroup title="Powertrain">
              <DetailItem label="Engine" value={vehicle.engine} />
              <DetailItem label="Transmission" value={vehicle.transmission} />
              <DetailItem label="Drivetrain" value={vehicle.drivetrain} />
              <DetailItem label="Fuel Type" value={vehicle.fuelType} />
            </DetailGroup>
            <DetailGroup title="Other">
              <DetailItem label="Exterior" value={vehicle.exteriorColor} />
              <DetailItem label="Interior" value={vehicle.interiorColor} />
              <DetailItem label="Doors" value={vehicle.doors} />
              <DetailItem label="Seats" value={vehicle.seats} />
              <DetailItem label="Stock #" value={vehicle.stockNumber} />
            </DetailGroup>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <SectionHeader title="Features" subtitle="Toggle features this vehicle has" />
        <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {FEATURE_FLAGS.map(({ key, label }) => {
              const isActive = features[key];
              return (
                <button
                  key={key}
                  onClick={() => onFeatureToggle(key)}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl text-sm transition-all text-left ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                      : "bg-zinc-50 text-zinc-600 border-2 border-transparent hover:border-zinc-200"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-emerald-500 text-white" : "border-2 border-zinc-300"
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Custom Features */}
      <section>
        <SectionHeader title="Custom Features" subtitle="Add any extra features" />
        <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFeature.trim()) {
                  onAddCustomFeature(newFeature.trim());
                  setNewFeature("");
                }
              }}
              placeholder="Type a feature..."
              className="flex-1 h-11 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
            />
            <Button
              onClick={() => {
                if (newFeature.trim()) {
                  onAddCustomFeature(newFeature.trim());
                  setNewFeature("");
                }
              }}
              disabled={!newFeature.trim()}
              variant="secondary"
              className="h-11 px-4"
            >
              <Plus className="w-5 h-5" />
              <span className="sm:hidden ml-2">Add</span>
            </Button>
          </div>
          {customFeatures.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customFeatures.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-sm text-zinc-700 font-medium"
                >
                  {feature}
                  <button
                    onClick={() => onRemoveCustomFeature(feature)}
                    className="p-0.5 rounded-full hover:bg-zinc-300 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No custom features added yet.</p>
          )}
        </div>
      </section>

      {/* Equipment from Decode */}
      {vehicle.equipmentRaw && vehicle.equipmentRaw.length > 0 && (
        <section>
          <SectionHeader
            title="Factory Equipment"
            subtitle={`${vehicle.equipmentRaw.length} items from VIN decode`}
          />
          <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-6">
            <div className="flex flex-wrap gap-1.5">
              {vehicle.equipmentRaw.map((item, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-zinc-100 text-xs text-zinc-600 font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-zinc-900">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 sm:p-6">
      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 sm:mb-4">{title}</h4>
      <div className="space-y-2 sm:space-y-3">{children}</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between text-xs sm:text-sm gap-2">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900 font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

// ============================================================================
// Pricing Tab
// ============================================================================

function PricingTab({
  vehicle,
  costsComponent,
  saleComponent,
  additionalCostsCents,
}: {
  vehicle: Vehicle;
  costsComponent: React.ReactNode;
  saleComponent: React.ReactNode;
  additionalCostsCents: number;
}) {
  const totalInvestment = (vehicle.purchasePriceCents ?? 0) + additionalCostsCents;
  const potentialProfit = (vehicle.askingPriceCents ?? 0) - totalInvestment;
  const profitMargin = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Profit Summary */}
      <section>
        <SectionHeader title="Profit Summary" subtitle="At-a-glance financials" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProfitCard
            label="Purchase Price"
            value={formatCurrency(vehicle.purchasePriceCents)}
            icon={ShoppingCart}
            color="blue"
          />
          <ProfitCard
            label="Additional Costs"
            value={formatCurrency(additionalCostsCents)}
            icon={Package}
            color="amber"
          />
          <ProfitCard
            label="Total Investment"
            value={formatCurrency(totalInvestment)}
            icon={DollarSign}
            color="zinc"
          />
          <ProfitCard
            label="Potential Profit"
            value={formatCurrency(potentialProfit)}
            subtitle={`${profitMargin.toFixed(1)}% margin`}
            icon={TrendingUp}
            color={potentialProfit >= 0 ? "emerald" : "red"}
          />
        </div>
      </section>

      {/* Sale Status */}
      <section>
        {saleComponent}
      </section>

      {/* Costs Management */}
      <section>
        {costsComponent}
      </section>
    </div>
  );
}

function ProfitCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: "blue" | "amber" | "zinc" | "emerald" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    zinc: "bg-zinc-50 text-zinc-700 border-zinc-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div className={`rounded-2xl border-2 p-5 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-sm mt-1 opacity-70">{subtitle}</p>}
    </div>
  );
}

// ============================================================================
// Edit Details Modal
// ============================================================================

function EditDetailsModal({
  vehicle,
  isOpen,
  onClose,
  onSave,
  isPending,
}: {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: Partial<Vehicle>) => void;
  isPending: boolean;
}) {
  const [details, setDetails] = useState({
    year: vehicle.year,
    make: vehicle.make ?? "",
    model: vehicle.model ?? "",
    trim: vehicle.trim ?? "",
    bodyStyle: vehicle.bodyStyle ?? "",
    drivetrain: vehicle.drivetrain ?? "",
    transmission: vehicle.transmission ?? "",
    engine: vehicle.engine ?? "",
    fuelType: vehicle.fuelType ?? "",
    doors: vehicle.doors,
    seats: vehicle.seats,
    odometerKm: vehicle.odometerKm,
    mileageUnit: (vehicle.mileageUnit as "KM" | "MI") ?? "KM",
    exteriorColor: vehicle.exteriorColor ?? "",
    interiorColor: vehicle.interiorColor ?? "",
    stockNumber: vehicle.stockNumber ?? "",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-zinc-900">Edit Vehicle Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Year">
              <input
                type="number"
                value={details.year ?? ""}
                onChange={(e) => setDetails({ ...details, year: e.target.value ? parseInt(e.target.value) : null })}
                className="form-input"
                placeholder="2020"
              />
            </FormField>
            <FormField label="Make">
              <input
                type="text"
                value={details.make}
                onChange={(e) => setDetails({ ...details, make: e.target.value })}
                className="form-input"
                placeholder="Honda"
              />
            </FormField>
            <FormField label="Model">
              <input
                type="text"
                value={details.model}
                onChange={(e) => setDetails({ ...details, model: e.target.value })}
                className="form-input"
                placeholder="Civic"
              />
            </FormField>
            <FormField label="Trim">
              <input
                type="text"
                value={details.trim}
                onChange={(e) => setDetails({ ...details, trim: e.target.value })}
                className="form-input"
                placeholder="EX-L"
              />
            </FormField>
            <FormField label="Body Style">
              <select
                value={details.bodyStyle}
                onChange={(e) => setDetails({ ...details, bodyStyle: e.target.value })}
                className="form-input"
              >
                <option value="">Select...</option>
                {BODY_STYLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Drivetrain">
              <select
                value={details.drivetrain}
                onChange={(e) => setDetails({ ...details, drivetrain: e.target.value })}
                className="form-input"
              >
                <option value="">Select...</option>
                {DRIVETRAIN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Transmission">
              <select
                value={details.transmission}
                onChange={(e) => setDetails({ ...details, transmission: e.target.value })}
                className="form-input"
              >
                <option value="">Select...</option>
                {TRANSMISSION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Fuel Type">
              <select
                value={details.fuelType}
                onChange={(e) => setDetails({ ...details, fuelType: e.target.value })}
                className="form-input"
              >
                <option value="">Select...</option>
                {FUEL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Engine">
              <input
                type="text"
                value={details.engine}
                onChange={(e) => setDetails({ ...details, engine: e.target.value })}
                className="form-input"
                placeholder="2.0L 4-Cyl"
              />
            </FormField>
            <FormField label="Odometer">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={details.odometerKm ?? ""}
                  onChange={(e) => setDetails({ ...details, odometerKm: e.target.value ? parseInt(e.target.value) : null })}
                  className="form-input flex-1"
                  placeholder="50000"
                />
                <select
                  value={details.mileageUnit}
                  onChange={(e) => setDetails({ ...details, mileageUnit: e.target.value as "KM" | "MI" })}
                  className="form-input w-20"
                >
                  <option value="KM">km</option>
                  <option value="MI">mi</option>
                </select>
              </div>
            </FormField>
            <FormField label="Exterior Color">
              <input
                type="text"
                value={details.exteriorColor}
                onChange={(e) => setDetails({ ...details, exteriorColor: e.target.value })}
                className="form-input"
                placeholder="Black"
              />
            </FormField>
            <FormField label="Interior Color">
              <input
                type="text"
                value={details.interiorColor}
                onChange={(e) => setDetails({ ...details, interiorColor: e.target.value })}
                className="form-input"
                placeholder="Black"
              />
            </FormField>
            <FormField label="Doors">
              <input
                type="number"
                value={details.doors ?? ""}
                onChange={(e) => setDetails({ ...details, doors: e.target.value ? parseInt(e.target.value) : null })}
                className="form-input"
                placeholder="4"
              />
            </FormField>
            <FormField label="Seats">
              <input
                type="number"
                value={details.seats ?? ""}
                onChange={(e) => setDetails({ ...details, seats: e.target.value ? parseInt(e.target.value) : null })}
                className="form-input"
                placeholder="5"
              />
            </FormField>
            <FormField label="Stock Number">
              <input
                type="text"
                value={details.stockNumber}
                onChange={(e) => setDetails({ ...details, stockNumber: e.target.value })}
                className="form-input"
                placeholder="STK-001"
              />
            </FormField>
          </div>
        </div>
        <div className="sticky bottom-0 bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(details)} disabled={isPending} isLoading={isPending}>
            Save Changes
          </Button>
        </div>
      </div>
      <style jsx>{`
        .form-input {
          height: 44px;
          width: 100%;
          border-radius: 10px;
          border: 1px solid #e4e4e7;
          padding: 0 14px;
          font-size: 14px;
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: #a1a1aa;
          box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.05);
        }
      `}</style>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VehiclePageV2({
  vehicle,
  photos,
  costs,
  additionalCostsCents,
  sale,
  listingPayload,
  marketSnapshotComponent,
  photosComponent,
  costsComponent,
  listingKitComponent,
  saleComponent,
}: VehiclePageV2Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // State
  const [status, setStatus] = useState<VehicleStatus>(vehicle.status);
  const [isPublic, setIsPublic] = useState(vehicle.isPublic);
  const [notes, setNotes] = useState(vehicle.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(vehicle.notes ?? "");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [customFeatures, setCustomFeatures] = useState<string[]>(vehicle.customFeatures ?? []);
  const [features, setFeatures] = useState({
    hasSunroof: vehicle.hasSunroof,
    hasNavigation: vehicle.hasNavigation,
    hasBackupCamera: vehicle.hasBackupCamera,
    hasParkingSensors: vehicle.hasParkingSensors,
    hasBlindSpotMonitor: vehicle.hasBlindSpotMonitor,
    hasHeatedSeats: vehicle.hasHeatedSeats,
    hasRemoteStart: vehicle.hasRemoteStart,
    hasAppleCarplay: vehicle.hasAppleCarplay,
    hasAndroidAuto: vehicle.hasAndroidAuto,
    hasBluetooth: vehicle.hasBluetooth,
    hasLeather: vehicle.hasLeather,
    hasThirdRow: vehicle.hasThirdRow,
    hasTowPackage: vehicle.hasTowPackage,
    hasAlloyWheels: vehicle.hasAlloyWheels,
  });

  const hasNotesChanged = notes !== savedNotes;
  const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  // Handlers
  function handleStatusChange(newStatus: VehicleStatus) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateVehicleStatusAction({ vehicleId: vehicle.id, status: newStatus });
    });
  }

  function handleVisibilityToggle() {
    const newValue = !isPublic;
    setIsPublic(newValue);
    startTransition(async () => {
      const result = await updateVehicleVisibilityAction({ vehicleId: vehicle.id, isPublic: newValue });
      if (!result.ok) setIsPublic(!newValue);
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      const result = await updateVehicleNotesAction({ vehicleId: vehicle.id, notes });
      if (result.ok) setSavedNotes(notes);
    });
  }

  async function handleFeatureToggle(key: string) {
    const typedKey = key as keyof typeof features;
    const newValue = !features[typedKey];
    setFeatures((prev) => ({ ...prev, [typedKey]: newValue }));
    const result = await updateVehicleFeaturesAction({ vehicleId: vehicle.id, [typedKey]: newValue });
    if (!result.ok) setFeatures((prev) => ({ ...prev, [typedKey]: !newValue }));
  }

  function handleAddCustomFeature(feature: string) {
    if (!customFeatures.includes(feature)) {
      const updated = [...customFeatures, feature];
      setCustomFeatures(updated);
      startTransition(async () => {
        await updateVehicleCustomFeaturesAction({ vehicleId: vehicle.id, customFeatures: updated });
        router.refresh();
      });
    }
  }

  function handleRemoveCustomFeature(feature: string) {
    const updated = customFeatures.filter((f) => f !== feature);
    setCustomFeatures(updated);
    startTransition(async () => {
      await updateVehicleCustomFeaturesAction({ vehicleId: vehicle.id, customFeatures: updated });
      router.refresh();
    });
  }

  async function handleSaveDetails(details: Partial<Vehicle>) {
    startTransition(async () => {
      const result = await updateVehicleDetailsAction({
        vehicleId: vehicle.id,
        year: details.year ?? null,
        make: details.make || null,
        model: details.model || null,
        trim: details.trim || null,
        bodyStyle: details.bodyStyle || null,
        drivetrain: details.drivetrain || null,
        transmission: details.transmission || null,
        engine: details.engine || null,
        fuelType: details.fuelType || null,
        doors: details.doors ?? null,
        seats: details.seats ?? null,
        odometerKm: details.odometerKm ?? null,
        mileageUnit: (details.mileageUnit as "KM" | "MI") ?? "KM",
        exteriorColor: details.exteriorColor || null,
        interiorColor: details.interiorColor || null,
        stockNumber: details.stockNumber || null,
      });
      if (result.ok) {
        setIsEditingDetails(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header with Navigation and Back Link */}
      <div className="flex items-center justify-between gap-4">
        <a
          href="/dashboard/vehicles"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to vehicles
        </a>
        <div className="hidden lg:block">
          <NavigationDropdown />
        </div>
      </div>

      {/* Photo Gallery - Full Width */}
      <PhotoGallery photos={photos} title={title} />

      {/* Vehicle Info Card */}
      <VehicleInfoCard
        vehicle={vehicle}
        status={status}
        isPublic={isPublic}
        onStatusChange={handleStatusChange}
        onVisibilityToggle={handleVisibilityToggle}
      />

      {/* Tabs Content */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-zinc-200 overflow-hidden">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-3 sm:p-6 md:p-8">
          {activeTab === "overview" && (
            <OverviewTab
              vehicle={vehicle}
              photosComponent={photosComponent}
              notes={notes}
              onNotesChange={setNotes}
              onSaveNotes={handleSaveNotes}
              hasNotesChanged={hasNotesChanged}
              isPending={isPending}
              onEditDetails={() => setIsEditingDetails(true)}
              onFeatureToggle={handleFeatureToggle}
              features={features}
              customFeatures={customFeatures}
              onAddCustomFeature={handleAddCustomFeature}
              onRemoveCustomFeature={handleRemoveCustomFeature}
            />
          )}
          {activeTab === "pricing" && (
            <PricingTab
              vehicle={vehicle}
              costsComponent={costsComponent}
              saleComponent={saleComponent}
              additionalCostsCents={additionalCostsCents}
            />
          )}
          {activeTab === "market" && (
            <div className="space-y-6">
              <SectionHeader title="Market Analysis" subtitle="Compare with similar vehicles" />
              {marketSnapshotComponent}
            </div>
          )}
          {activeTab === "listing" && (
            <div className="space-y-6">
              <SectionHeader title="Listing Kit" subtitle="Generate marketing materials" />
              {listingKitComponent}
            </div>
          )}
        </div>
      </div>

      {/* Edit Details Modal */}
      <EditDetailsModal
        vehicle={vehicle}
        isOpen={isEditingDetails}
        onClose={() => setIsEditingDetails(false)}
        onSave={handleSaveDetails}
        isPending={isPending}
      />
    </div>
  );
}
