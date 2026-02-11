import RateFilter from "./components/RateFilter";
import ImageCarousel from "./components/ImageCarousel";

export default function RateSheet() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Rate Sheet</h1>

     
      <RateFilter />

      
      <ImageCarousel />
    </div>
  );
}
