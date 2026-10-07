import React, { useMemo, useState } from 'react';
import {
  Search,
  ExternalLink,
  Newspaper,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { NewsItem } from '@/types/farm';

interface NewsPanelProps {
  news: NewsItem[];
  aiAnalysis?: string;
}

const PAGE_SIZE = 10;

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const NewsPanel: React.FC<NewsPanelProps> = ({ news, aiAnalysis }) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const hasNews = Array.isArray(news) && news.length > 0;
  const normalizedAiAnalysis = aiAnalysis?.trim();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return news;
    return news.filter(
      n =>
        n.title.toLowerCase().includes(q) || n.source.toLowerCase().includes(q)
    );
  }, [news, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  if (!hasNews && !normalizedAiAnalysis) {
    return (
      <div className='flex flex-col items-center justify-center py-8 text-center'>
        <Newspaper className='h-12 w-12 text-neutral-300 mb-3' />
        <p className='text-sm text-neutral-600'>No news available</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {normalizedAiAnalysis && (
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-3'>
          <p className='text-[11px] font-semibold uppercase tracking-wide text-orange-700'>
            AI News Analysis
          </p>
          <p className='mt-1 text-xs leading-relaxed text-orange-900'>
            {normalizedAiAnalysis}
          </p>
        </div>
      )}

      {!hasNews ? (
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <Newspaper className='h-12 w-12 text-neutral-300 mb-3' />
          <p className='text-sm text-neutral-600'>No news available</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400' />
            <input
              type='text'
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder='Search by title or source…'
              className='w-full pl-8 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400'
            />
          </div>

          {/* Result count */}
          <div className='text-xs text-neutral-500'>
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
            {query && <span className='ml-1'>for "{query}"</span>}
          </div>

          {/* News list */}
          {pageItems.length === 0 ? (
            <div className='py-8 text-center text-sm text-neutral-500'>
              No news matches your search.
            </div>
          ) : (
            <ul className='space-y-2'>
              {pageItems.map((item, idx) => (
                <li
                  key={`${item.url}-${start + idx}`}
                  className='border border-neutral-200 rounded-lg p-3 hover:border-orange-300 hover:bg-orange-50/30 transition-colors'
                >
                  <a
                    href={item.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block group'
                  >
                    <div className='flex items-start gap-2'>
                      {item.urlToImage && (
                        <img
                          src={item.urlToImage}
                          alt=''
                          loading='lazy'
                          onError={e => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = 'none';
                          }}
                          className='w-14 h-14 rounded object-cover flex-shrink-0 bg-neutral-100'
                        />
                      )}
                      <div className='flex-1 min-w-0'>
                        <h4 className='text-xs font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-orange-700'>
                          {item.title}
                        </h4>
                        <div className='flex items-center gap-1.5 mt-1 text-[10px] text-neutral-500'>
                          <span className='font-medium text-neutral-700 truncate'>
                            {item.source}
                          </span>
                          <span>•</span>
                          <span className='flex-shrink-0'>
                            {formatDate(item.publishedAt)}
                          </span>
                          <ExternalLink className='h-2.5 w-2.5 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100' />
                        </div>
                      </div>
                    </div>
                    {item.description && (
                      <p className='text-[11px] text-neutral-600 mt-2 line-clamp-2 leading-snug'>
                        {item.description}
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between pt-2 border-t border-neutral-100'>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='flex items-center gap-1 px-2 py-1 text-xs text-neutral-700 rounded hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent'
              >
                <ChevronLeft className='h-3.5 w-3.5' />
                Prev
              </button>
              <span className='text-xs text-neutral-600'>
                Page{' '}
                <span className='font-semibold text-neutral-900'>
                  {currentPage}
                </span>{' '}
                of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className='flex items-center gap-1 px-2 py-1 text-xs text-neutral-700 rounded hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent'
              >
                Next
                <ChevronRight className='h-3.5 w-3.5' />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
