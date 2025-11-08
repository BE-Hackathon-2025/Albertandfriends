import Header from "@/components/Header";
import ImageUploader from "@/components/ImageUploader";

const Gallery = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Image Gallery</h1>
        <p className="text-muted-foreground mb-6">
          Upload and manage your images
        </p>
        
        <ImageUploader />
      </div>
    </div>
  );
};

export default Gallery;
