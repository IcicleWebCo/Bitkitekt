import { useState, useEffect, useMemo, useRef } from 'react';
import { FileCode } from 'lucide-react';
import { postService } from './services/postService';
import { PostCard } from './components/PostCard';
import { FilterBar } from './components/FilterBar';
import type { Post } from './types/database';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      console.log('loading posts');
      const data = await postService.getAllPosts();
      console.log(data);
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const uniqueTopics = useMemo(() => {
    const topics = new Set<string>();
    posts.forEach(post => {
      if (post.primary_topic) {
        topics.add(post.primary_topic);
      }
    });
    return Array.from(topics).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedTopics.size === 0) {
      return posts;
    }
    return posts.filter(post =>
      post.primary_topic && selectedTopics.has(post.primary_topic)
    );
  }, [posts, selectedTopics]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topic)) {
        newSet.delete(topic);
      } else {
        newSet.add(topic);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSelectedTopics(new Set());
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-lg">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md">
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <FileCode className="w-20 h-20 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-xl">No posts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950">
      {uniqueTopics.length > 0 && (
        <FilterBar
          topics={uniqueTopics}
          selectedTopics={selectedTopics}
          onToggleTopic={toggleTopic}
          onClearAll={clearAllFilters}
          scrollContainerRef={scrollContainerRef}
        />
      )}
      <div ref={scrollContainerRef} className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {filteredPosts.length === 0 ? (
          <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="text-center">
              <FileCode className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-xl">No posts match your filters</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
