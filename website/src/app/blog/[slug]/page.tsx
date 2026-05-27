import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import Navbar from '@/components/Navbar';
import { Sparkles, Calendar, User, Clock, Share2, ArrowLeft, Bookmark, Paperclip, FileText } from 'lucide-react';
import { safeFormat } from '@/lib/safe-date';

export const revalidate = 3600; // Cache for 1 hour

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBlog(slug: string) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const blog = await db.collection('seo_content').findOne({ slug: slug });
    return blog;
  } catch (error) {
    console.error("Error fetching blog:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  
  if (!blog) return { title: 'Blog Not Found | Sahimed' };

  return {
    title: `${blog.title} | Sahimed Health Blog`,
    description: blog.excerpt,
    keywords: blog.keywords,
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      type: 'article',
      publishedTime: blog.createdAt?.toISOString(),
      authors: ['Sahimed Health Team'],
    }
  };
}

function renderVideoEmbed(url: string) {
  if (!url) return null;
  
  // Check for YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    return (
      <div className="my-12 aspect-video w-full overflow-hidden rounded-[32px] shadow-2xl border border-slate-100">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  
  // Check for Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return (
      <div className="my-12 aspect-video w-full overflow-hidden rounded-[32px] shadow-2xl border border-slate-100">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          title="Vimeo video player"
          className="w-full h-full border-none"
          allowFullScreen
        />
      </div>
    );
  }

  // Standard mp4 video player
  if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
    return (
      <div className="my-12 w-full overflow-hidden rounded-[32px] shadow-2xl border border-slate-100">
        <video src={url} controls className="w-full" />
      </div>
    );
  }

  // Fallback: render link
  return (
    <div className="my-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
      <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Video Resource</span>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-black uppercase tracking-wider">
        Watch Video
      </a>
    </div>
  );
}

export default async function BlogPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  // Estimated reading time
  const wordCount = blog.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen bg-[#FDFEFF]">
      <Navbar />
      
      {/* Premium Hero Header */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-white -z-10" />
        <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl -z-10 animate-pulse" />
        
        <div className="max-w-4xl mx-auto px-6">
          <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-12 group font-bold text-xs uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Health Blog
          </button>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                {blog.category || 'Health Advice'}
              </span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {readingTime} Min Read
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-[0.95] font-outfit uppercase">
              {blog.title}
            </h1>

            <p className="text-xl sm:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl">
              {blog.excerpt}
            </p>

            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                  S
                </div>
                <div>
                  <p className="text-slate-900 font-black uppercase text-sm tracking-tight">Sahimed Health Team</p>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Verified Content</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <button className="p-3 rounded-2xl border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all shadow-sm">
                   <Share2 className="w-5 h-5" />
                 </button>
                 <button className="p-3 rounded-2xl border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all shadow-sm">
                   <Bookmark className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 pb-32">
        <article 
          className="prose prose-slate prose-lg max-w-none 
            prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-headings:font-outfit prose-headings:text-slate-900
            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-xl
            prose-strong:text-slate-900 prose-strong:font-black
            prose-ul:list-disc prose-li:text-slate-600 prose-li:text-lg
            prose-img:rounded-[32px] prose-img:shadow-2xl prose-img:border prose-img:border-slate-100"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Images Gallery */}
        {blog.images && blog.images.length > 0 && (
          <div className="my-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {blog.images.map((imgUrl: string, idx: number) => (
              <div key={idx} className="relative overflow-hidden rounded-[24px] shadow-lg border border-slate-100 group">
                <img 
                  src={imgUrl} 
                  alt={`Blog image ${idx + 1}`} 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            ))}
          </div>
        )}

        {/* Video Embed */}
        {blog.videoLink && renderVideoEmbed(blog.videoLink)}

        {/* Attachments Section */}
        {blog.attachments && blog.attachments.length > 0 && (
          <div className="my-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-primary" />
              Downloads & Attachments
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {blog.attachments.map((url: string, idx: number) => {
                const fileName = url.substring(url.lastIndexOf('/') + 1) || `Document #${idx + 1}`;
                return (
                  <a 
                    key={idx} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary hover:shadow-md transition-all group"
                  >
                    <FileText className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-800 truncate uppercase group-hover:text-primary transition-colors">{fileName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Click to View</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-wrap gap-2">
          {blog.keywords?.map((keyword: string) => (
            <span key={keyword} className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer">
              #{keyword}
            </span>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[48px] p-10 sm:p-16 relative overflow-hidden text-center group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="relative z-10 space-y-6">
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase font-outfit leading-none">
              Get Authentic Medicines <br/> Delivered Safely
            </h3>
            <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto">
              Don't wait. Sahimed delivers authentic healthcare products at your doorstep with verified prescriptions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="/" className="bg-primary hover:bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-tighter text-lg shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                Shop Medicines Now
              </a>
              <a href="/prescription" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-10 py-5 rounded-2xl font-black uppercase tracking-tighter text-lg backdrop-blur-md transition-all">
                Upload Prescription
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
