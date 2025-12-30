"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Car,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Pencil,
  Copy,
  ExternalLink,
  Gauge,
  Fuel,
  Cog,
  Palette,
  Calendar,
  Hash,
  StickyNote,
  Tag,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingCart,
  BadgeCheck,
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
  // Feature flags
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

type VehiclePageRedesignProps = {
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

type TabId = typeof TABS[number]["id"];

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

// ============================================================================
// Hero Section - Photo Gallery + Key Info
// ============================================================================

function HeroSection({
  vehicle,
  photos,
  status,
  isPublic,
  onStatusChange,
  onVisibilityToggle,
}: {
  vehicle: Vehicle;
  photos: Photo[];
  status: VehicleStatus;
  isPublic: boolean;
  onStatusChange: (status: VehicleStatus) => void;
  onVisibilityToggle: () => void;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.isCover) return -1;
    if (b.isCover) return 1;
    return a.position - b.position;
  });

  const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const subtitle = vehicle.trim || "";
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  const nextPhoto = () => {
    if (sortedPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % sortedPhotos.length);
    }
  };

  const prevPhoto = () => {
    if (sortedPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    }
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
      <div className="grid lg:grid-cols-2 gap-0">
        {/* Photo Gallery */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[400px] bg-zinc-950">
          {sortedPhotos.length > 0 ? (
            <>
              <Image
                src={sortedPhotos[currentPhotoIndex].url}
                alt={title}
                fill
                className="object-cover"
                priority
              />
              {sortedPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {sortedPhotos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPhotoIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentPhotoIndex
                            ? "bg-white w-6"
                            : "bg-white/50 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                {currentPhotoIndex + 1} / {sortedPhotos.length}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-zinc-500">
                <Car className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No photos yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="p-6 lg:p-8 flex flex-col">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                {title || "Untitled Vehicle"}
              </h1>
              {subtitle && (
                <p className="text-lg text-zinc-400">{subtitle}</p>
              )}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <SpecItem
              icon={Gauge}
              label="Odometer"
              value={vehicle.odometerKm ? `${formatNumber(vehicle.odometerKm)} ${vehicle.mileageUnit?.toLowerCase() || "km"}` : "—"}
            />
            <SpecItem
              icon={Cog}
              label="Transmission"
              value={vehicle.transmission || "—"}
            />
            <SpecItem
              icon={Fuel}
              label="Fuel Type"
              value={vehicle.fuelType || "—"}
            />
            <SpecItem
              icon={Truck}
              label="Drivetrain"
              value={vehicle.drivetrain || "—"}
            />
          </div>

          {/* VIN */}
          <div className="bg-zinc-800/50 rounded-lg px-4 py-3 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">VIN</p>
                <p className="font-mono text-sm text-zinc-300">{vehicle.vin}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(vehicle.vin)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                title="Copy VIN"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Purchase Price</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(vehicle.purchasePriceCents)}
              </p>
            </div>
            <div className="bg-emerald-900/30 rounded-lg px-4 py-3 border border-emerald-800/50">
              <p className="text-xs text-emerald-400 uppercase tracking-wider mb-0.5">Asking Price</p>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(vehicle.askingPriceCents)}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-auto flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as VehicleStatus)}
              className="h-10 px-4 rounded-lg bg-zinc-700 text-white text-sm border-0 focus:ring-2 focus:ring-white/20"
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
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isPublic ? "Public" : "Hidden"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-zinc-700/50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
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
    <div className="border-b border-zinc-200">
      <nav className="flex gap-1 -mb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ============================================================================
// Overview Tab Content
// ============================================================================

function OverviewTab({
  vehicle,
  photosComponent,
  onEditDetails,
  onFeatureToggle,
  features,
  customFeatures,
  onAddCustomFeature,
  onRemoveCustomFeature,
}: {
  vehicle: Vehicle;
  photosComponent: React.ReactNode;
  onEditDetails: () => void;
  onFeatureToggle: (key: string) => void;
  features: Record<string, boolean>;
  customFeatures: string[];
  onAddCustomFeature: (feature: string) => void;
  onRemoveCustomFeature: (feature: string) => void;
}) {
  const [newFeature, setNewFeature] = useState("");

  return (
    <div className="space-y-8">
      {/* Photos Section */}
      <section>
        <SectionHeader title="Photos" subtitle="Manage vehicle photos" />
        {photosComponent}
      </section>

      {/* Vehicle Details */}
      <section>
        <SectionHeader
          title="Vehicle Details"
          subtitle="Core specifications"
          action={
            <button
              onClick={onEditDetails}
              className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          }
        />
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
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
              <DetailItem label="Exterior Color" value={vehicle.exteriorColor} />
              <DetailItem label="Interior Color" value={vehicle.interiorColor} />
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
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {FEATURE_FLAGS.map(({ key, label }) => {
              const isActive = features[key];
              return (
                <button
                  key={key}
                  onClick={() => onFeatureToggle(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center ${
                      isActive ? "bg-emerald-500 text-white" : "border border-zinc-300"
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3" />}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Custom Features */}
      <section>
        <SectionHeader title="Custom Features" subtitle="Add any extra features" />
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex gap-2 mb-4">
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
              placeholder="Type a feature and press Enter..."
              className="flex-1 h-10 px-4 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
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
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {customFeatures.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customFeatures.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-sm text-zinc-700"
                >
                  {feature}
                  <button
                    onClick={() => onRemoveCustomFeature(feature)}
                    className="p-0.5 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600"
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
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex flex-wrap gap-2">
              {vehicle.equipmentRaw.map((item, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-zinc-100 text-xs text-zinc-600"
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
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900 font-medium">{value ?? "—"}</span>
    </div>
  );
}

// ============================================================================
// Pricing Tab Content
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
      {saleComponent}

      {/* Costs Management */}
      {costsComponent}
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
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    zinc: "bg-zinc-50 text-zinc-600 border-zinc-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-sm mt-1 opacity-70">{subtitle}</p>}
    </div>
  );
}

// ============================================================================
// Sidebar - Notes & Quick Info
// ============================================================================

function Sidebar({
  vehicle,
  notes,
  onNotesChange,
  onSaveNotes,
  hasNotesChanged,
  isPending,
}: {
  vehicle: Vehicle;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
  hasNotesChanged: boolean;
  isPending: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Quick Info Card */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Quick Info</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Stock #</span>
            <span className="font-medium text-zinc-900">{vehicle.stockNumber || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Odometer</span>
            <span className="font-medium text-zinc-900">
              {vehicle.odometerKm ? `${formatNumber(vehicle.odometerKm)} ${vehicle.mileageUnit?.toLowerCase() || "km"}` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Exterior</span>
            <span className="font-medium text-zinc-900">{vehicle.exteriorColor || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Interior</span>
            <span className="font-medium text-zinc-900">{vehicle.interiorColor || "—"}</span>
          </div>
        </div>
      </div>

      {/* Notes Card */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <StickyNote className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900">Internal Notes</h3>
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes about this vehicle..."
          className="w-full min-h-[120px] p-3 rounded-lg border border-zinc-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
        />
        {hasNotesChanged && (
          <Button
            onClick={onSaveNotes}
            disabled={isPending}
            isLoading={isPending}
            size="sm"
            className="mt-3 w-full"
          >
            Save Notes
          </Button>
        )}
      </div>
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
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Edit Vehicle Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg"
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
          height: 40px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid #e4e4e7;
          padding: 0 12px;
          font-size: 14px;
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

export function VehiclePageRedesign({
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
}: VehiclePageRedesignProps) {
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
    <div className="min-h-screen bg-zinc-50">
      {/* Back Link */}
      <div className="mb-6">
        <a
          href="/dashboard/vehicles"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to vehicles
        </a>
      </div>

      {/* Hero Section */}
      <HeroSection
        vehicle={vehicle}
        photos={photos}
        status={status}
        isPublic={isPublic}
        onStatusChange={handleStatusChange}
        onVisibilityToggle={handleVisibilityToggle}
      />

      {/* Main Content */}
      <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Left Column - Tabs */}
        <div className="min-w-0">
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="p-6">
              {activeTab === "overview" && (
                <OverviewTab
                  vehicle={vehicle}
                  photosComponent={photosComponent}
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
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Sidebar
            vehicle={vehicle}
            notes={notes}
            onNotesChange={setNotes}
            onSaveNotes={handleSaveNotes}
            hasNotesChanged={hasNotesChanged}
            isPending={isPending}
          />
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
