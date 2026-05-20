import { Metadata } from 'next';
import clientPromise from '@/lib/mongodb';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Sparkles, Clock, ArrowRight, BookOpen } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Health Blog | Sahimed - Expert Medical Advice & Wellness',
  description: 'Explore the latest health tips, Ayurvedic wisdom, and medical guides from Sahimed health experts.',
};

async function getBlogs() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    return await db.collection('seo_content').find({}).sort({ createdAt: -1 }).toArray();
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

export default async function BlogListingPage() {
  const blogs = await getBlogs();

  return (
    <div className="min-h-screen bg-[#FDFEFF]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-white -z-10" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 w-fit">
              <BookOpen className="w-3 h-3" />
              Sahimed Health Library
            </span>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 leading-none font-outfit uppercase">
              Your Daily Dose of <br/> <span className="text-primary italic">Health Wisdom</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Expert-backed articles on Ayurveda, chronic care, and modern medicine, tailored for the Indian lifestyle.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog: any) => (
              <Link 
                key={blog.slug} 
                href={`/blog/${blog.slug}`}
                className="group bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 flex flex-col"
              >
                <div className="p-8 space-y-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {blog.category || 'Health'}
                    </span>
                    <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.ceil(blog.content.split(/\s+/).length / 200)} Min Read
                    </span>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-primary transition-colors font-outfit uppercase">
                      {blog.title}
                    </h3>
                    <p className="text-slate-500 font-medium line-clamp-3 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between group/btn">
                    <span className="text-slate-900 font-black text-xs uppercase tracking-tighter">Read Full Story</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Writing our first stories...</h3>
            <p className="text-slate-400 font-medium mt-2">Check back soon for expert health advice.</p>
          </div>
        )}
      </main>
    </div>
  );
}
