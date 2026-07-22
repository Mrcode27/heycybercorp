"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "./Icon";
import { youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/youtube";

/**
 * Homepage free-content grid. Admin-managed (see /admin/videos). Renders
 * nothing until at least one video is published, so the section never shows
 * an empty shell.
 */
export default function FreeContent() {
  const videos = useQuery(api.freeVideos.listPublished);
  if (!videos || videos.length === 0) return null;

  return (
    <div className="mb-20">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 text-primary font-label-mono mb-4">
          <span className="h-px w-8 bg-primary" />
          CONTENU GRATUIT
        </div>
        <h2 className="font-headline-lg text-headline-xl text-white mb-4 text-balance">
          Apprenez gratuitement, puis allez plus loin
        </h2>
        <p className="text-on-surface-variant max-w-2xl mx-auto">
          Regardez nos contenus offerts. S&apos;ils vous parlent, nos formations complètes prennent
          le relais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((v) => {
          const embed = youtubeEmbedUrl(v.youtubeUrl);
          const watch = youtubeWatchUrl(v.youtubeUrl) ?? v.youtubeUrl;
          return (
            <div key={v._id} className="glass-panel rounded-xl overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-[#000202]">
                {embed ? (
                  <iframe
                    src={embed}
                    title={v.title}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <a
                    href={watch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Icon name="play_circle" className="text-5xl text-primary" fill />
                  </a>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-headline-lg-mobile text-on-surface mb-2">{v.title}</h3>
                <p className="text-on-surface-variant text-sm mb-6 flex-grow">{v.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-auto pt-4 border-t border-outline-variant/20">
                  <a
                    href={watch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-label-mono text-label-mono text-on-surface-variant hover:text-secondary transition-colors"
                  >
                    <Icon name="smart_display" className="text-sm" />
                    Sur YouTube
                  </a>
                  {v.courseSlug && (
                    <Link
                      href={`/formations/${v.courseSlug}`}
                      className="inline-flex items-center gap-1.5 font-label-mono text-label-mono text-primary hover:underline"
                    >
                      <Icon name="school" className="text-sm" />
                      Voir la formation
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
