import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 10; // Revalidate every 10 seconds for instant updates from admin panel
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, initializeApp as initApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import Navbar from '@/components/Navbar';
import { safeFormat } from '@/lib/safe-date';

// Initialize Firebase for Server-Side Rendering
const app = getApps().length === 0 ? initApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string) {
  try {
    const docRef = doc(db, 'pages', slug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.error("Error fetching page:", error);
  }
  return null;
}

export async function generateStaticParams() {
  try {
    const querySnapshot = await getDocs(collection(db, 'pages'));
    return querySnapshot.docs.map((doc) => ({
      slug: doc.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return {
    title: page ? `${page.title} | SahiMed` : 'Page Not Found',
    description: `Official ${page?.title || 'policy'} document for SahiMed Healthcare Pharmacy.`,
    alternates: {
      canonical: `https://sahimed.com/p/${slug}`,
    },
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  const content = page.autoFormat 
    ? (page.content || '').replace(/\n/g, '<br />') 
    : (page.content || '');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-20 sm:py-32">
        <div className="bg-white rounded-[48px] p-8 sm:p-20 shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className="mb-12 border-b border-slate-100 pb-12">
              <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase mb-4 block">Official Document</span>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-none">
                {page.title}
              </h1>
              {page.lastUpdated && (
                <p className="text-[10px] font-bold text-slate-400 mt-6 tracking-widest uppercase">
                  Last Updated: {safeFormat(page.lastUpdated, 'MMMM dd, yyyy')}
                </p>
              )}
           </div>

           <div 
             className="prose prose-slate max-w-none 
               prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-headings:font-outfit
               prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
               prose-strong:text-slate-900 prose-strong:font-black
               prose-ul:list-disc prose-li:text-slate-600"
             dangerouslySetInnerHTML={{ __html: content }}
           />
        </div>
      </main>
    </div>
  );
}
