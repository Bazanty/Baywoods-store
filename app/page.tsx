import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import TrendingSection from "@/components/home/TrendingSection";
import CollectionBanner from "@/components/home/CollectionBanner";
import NewArrivalsSection from "@/components/home/NewArrivalsSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import SocialProof from "@/components/home/SocialProof";
import NewsletterSection from "@/components/home/NewsletterSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <TrendingSection />
      <CollectionBanner />
      <NewArrivalsSection />
      <WhyChooseUs />
      <SocialProof />
      <NewsletterSection />
      <div className="pb-24" />
    </>
  );
}
