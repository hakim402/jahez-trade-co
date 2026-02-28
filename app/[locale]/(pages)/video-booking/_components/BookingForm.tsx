"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  MapPin,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  Video,
  MessageCircle,
} from "lucide-react";
import { PaymentDialog } from "./Dialogs/PaymentDialog";
import { SuccessDialog } from "./Dialogs/SuccessDialog";
import { useTranslations } from "next-intl";

interface BookingFormProps {
  onSuccess?: () => void;
}

type MarketLocation = "yiwu" | "guangzhou" | "shenzhen";
type VideoPlatform = "zoom" | "google-meet" | "whatsapp";
type BookingType = "market" | "factory";

const MARKETS: { id: MarketLocation; name: string; description: string }[] = [
  {
    id: "yiwu",
    name: "Yiwu Market",
    description: "World's largest small commodities market",
  },
  {
    id: "guangzhou",
    name: "Guangzhou",
    description: "Electronics, textiles, and wholesale goods",
  },
  {
    id: "shenzhen",
    name: "Shenzhen",
    description: "Electronics, tech products, and innovation hub",
  },
];

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

const PLATFORMS: {
  id: VideoPlatform;
  nameKey: string;
  icon: React.ElementType;
}[] = [
  { id: "zoom", nameKey: "zoom", icon: Video },
  { id: "google-meet", nameKey: "googleMeet", icon: Video },
  { id: "whatsapp", nameKey: "whatsapp", icon: MessageCircle },
];

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const t = useTranslations("VideoBookingPage.bookingForm");
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [bookingType, setBookingType] = useState<BookingType>("market");
  const [selectedMarket, setSelectedMarket] = useState<MarketLocation>("yiwu");
  const [factoryName, setFactoryName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<VideoPlatform>("zoom");
  const [notes, setNotes] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Booking created:", {
      type: bookingType,
      location: bookingType === "market" ? selectedMarket : undefined,
      factoryName: bookingType === "factory" ? factoryName : undefined,
      date: selectedDate,
      timeSlot: selectedTime,
      platform: selectedPlatform,
      notes,
    });

    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSuccess?.();
    router.push("/dashboard");
  };

  return (
    <>
      <Card className="group bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="dark:text-white">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Booking Type */}
            <div className="space-y-3">
              <Label className="dark:text-white">{t("labels.bookingType")}</Label>
              <RadioGroup
                value={bookingType}
                onValueChange={(value) => setBookingType(value as BookingType)}
                className="grid sm:grid-cols-2 gap-4"
              >
                <BookingTypeOption
                  value="market"
                  label={t("bookingTypes.market")}
                  description={t("bookingTypes.marketDescription")}
                  icon={MapPin}
                />
                <BookingTypeOption
                  value="factory"
                  label={t("bookingTypes.factory")}
                  description={t("bookingTypes.factoryDescription")}
                  icon={Building2}
                />
              </RadioGroup>
            </div>

            {/* Market Selection */}
            {bookingType === "market" && (
              <div className="space-y-3">
                <Label className="dark:text-white">{t("labels.market")}</Label>
                <RadioGroup
                  value={selectedMarket}
                  onValueChange={(value) =>
                    setSelectedMarket(value as MarketLocation)
                  }
                  className="space-y-3"
                >
                  {MARKETS.map((market) => (
                    <MarketOption key={market.id} market={market} />
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Factory Name */}
            {bookingType === "factory" && (
              <div className="space-y-3">
                <Label htmlFor="factoryName" className="dark:text-white">
                  {t("labels.factoryName")}
                </Label>
                <Input
                  id="factoryName"
                  placeholder={t("placeholders.factoryName")}
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  className="bg-background/50 border-border focus-visible:ring-brand"
                />
              </div>
            )}

            {/* Date and Time */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="date" className="dark:text-white">
                  <Calendar className="h-4 w-4 inline mr-2 text-brand" />
                  {t("labels.date")}
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={minDate}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="bg-background/50 border-border focus-visible:ring-brand"
                />
              </div>
              <div className="space-y-3">
                <Label className="dark:text-white">
                  <Clock className="h-4 w-4 inline mr-2 text-brand" />
                  {t("labels.time")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <TimeSlotButton
                      key={time}
                      time={time}
                      selected={selectedTime === time}
                      onClick={() => setSelectedTime(time)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Video Platform */}
            <div className="space-y-3">
              <Label className="dark:text-white">{t("labels.platform")}</Label>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map((platform) => (
                  <PlatformOption
                    key={platform.id}
                    platform={{
                      ...platform,
                      name: t(`platforms.${platform.nameKey}`),
                    }}
                    selected={selectedPlatform === platform.id}
                    onSelect={() => setSelectedPlatform(platform.id)}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="dark:text-white">
                {t("labels.notes")}
              </Label>
              <Textarea
                id="notes"
                placeholder={t("placeholders.notes")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background/50 border-border focus-visible:ring-brand min-h-25"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-brand hover:bg-brand/90 text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("submitting") : t("submit")}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </form>
        </CardContent>
        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
      </Card>

      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        onPaymentComplete={handlePaymentSuccess}
        bookingDetails={{
          type: bookingType,
          market: selectedMarket,
          date: selectedDate,
          time: selectedTime,
        }}
      />

      <SuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        onClose={handleSuccessClose}
        bookingDetails={{
          type: bookingType,
          market: selectedMarket,
          date: selectedDate,
          time: selectedTime,
          platform: selectedPlatform,
        }}
      />
    </>
  );
}

// Subcomponents (updated to accept translation strings)
function BookingTypeOption({
  value,
  label,
  description,
  icon: Icon,
}: {
  value: string;
  label: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div>
      <RadioGroupItem value={value} id={value} className="peer sr-only" />
      <Label
        htmlFor={value}
        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-brand peer-data-[state=checked]:bg-brand/5 cursor-pointer transition-all"
      >
        <Icon className="h-6 w-6 mb-2 text-brand" />
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground mt-1">{description}</span>
      </Label>
    </div>
  );
}

function MarketOption({
  market,
}: {
  market: { id: string; name: string; description: string };
}) {
  return (
    <div>
      <RadioGroupItem value={market.id} id={market.id} className="peer sr-only" />
      <Label
        htmlFor={market.id}
        className="flex items-center gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-brand peer-data-[state=checked]:bg-brand/5 cursor-pointer transition-all"
      >
        <MapPin className="h-5 w-5 text-brand" />
        <div className="flex-1">
          <span className="font-medium dark:text-white">{market.name}</span>
          <p className="text-sm text-muted-foreground">{market.description}</p>
        </div>
      </Label>
    </div>
  );
}

function TimeSlotButton({
  time,
  selected,
  onClick,
}: {
  time: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
        selected
          ? "bg-brand text-white shadow-md"
          : "bg-muted hover:bg-muted/80 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      }`}
    >
      {time}
    </button>
  );
}

function PlatformOption({
  platform,
  selected,
  onSelect,
}: {
  platform: { id: string; name: string; icon: React.ElementType };
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = platform.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 transition-all ${
        selected
          ? "border-brand bg-brand/5 text-brand"
          : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{platform.name}</span>
    </button>
  );
}