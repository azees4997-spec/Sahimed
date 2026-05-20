'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Blog {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
}

export default function LatestBlogs({ blogs }: { blogs: Blog[] }) {
  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col sm:flex-row items-end justify-between gap-6 mb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-primary font-black uppercase text-[10px] tracking-widest">Sahimed Health Library</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-none">
            Expert Health <br/> <span className="text-primary italic">Insights</span>
          </h2>
        </div>
        <Link 
          href="/blog" 
          className="group flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:bg-slate-50 transition-all font-black uppercase text-xs tracking-tight"
        >
          View All Articles
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {blogs.slice(0, 3).map((blog, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link 
              href={`/blog/${blog.slug}`}
              className="group bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {blog.category || 'Health'}
                </span>
                <span className="text-slate-300 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.ceil(blog.content.split(/\s+/).length / 200)} Min
                </span>
              </div>
              
              <div className="space-y-4 flex-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-primary transition-colors font-outfit uppercase">
                  {blog.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed">
                  {blog.excerpt}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-slate-900 font-black text-[10px] uppercase tracking-tighter">Read More</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
