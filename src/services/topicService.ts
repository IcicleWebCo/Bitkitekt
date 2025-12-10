import { supabase } from '../lib/supabase';

export interface Topic {
  id: string;
  name: string;
  gradient_from: string;
  gradient_to: string;
  hover_gradient_from: string;
  hover_gradient_to: string;
  created_at: string;
  updated_at: string;
}

export interface TopicGradient {
  from: string;
  to: string;
  hoverFrom: string;
  hoverTo: string;
}

const COLOR_PALETTE: Array<{ from: string; to: string; hoverFrom: string; hoverTo: string }> = [
  { from: 'cyan-500', to: 'blue-500', hoverFrom: 'cyan-400', hoverTo: 'blue-400' },
  { from: 'orange-500', to: 'red-500', hoverFrom: 'orange-400', hoverTo: 'red-400' },
  { from: 'teal-500', to: 'cyan-500', hoverFrom: 'teal-400', hoverTo: 'cyan-400' },
  { from: 'emerald-500', to: 'green-500', hoverFrom: 'emerald-400', hoverTo: 'green-400' },
  { from: 'amber-500', to: 'orange-500', hoverFrom: 'amber-400', hoverTo: 'orange-400' },
  { from: 'sky-500', to: 'blue-500', hoverFrom: 'sky-400', hoverTo: 'blue-400' },
  { from: 'rose-500', to: 'pink-500', hoverFrom: 'rose-400', hoverTo: 'pink-400' },
  { from: 'green-500', to: 'teal-500', hoverFrom: 'green-400', hoverTo: 'teal-400' },
  { from: 'yellow-500', to: 'amber-500', hoverFrom: 'yellow-400', hoverTo: 'amber-400' },
  { from: 'lime-500', to: 'green-500', hoverFrom: 'lime-400', hoverTo: 'green-400' },
  { from: 'blue-500', to: 'cyan-500', hoverFrom: 'blue-400', hoverTo: 'cyan-400' },
  { from: 'red-500', to: 'orange-500', hoverFrom: 'red-400', hoverTo: 'orange-400' },
  { from: 'pink-500', to: 'rose-500', hoverFrom: 'pink-400', hoverTo: 'rose-400' },
  { from: 'teal-500', to: 'emerald-500', hoverFrom: 'teal-400', hoverTo: 'emerald-400' },
  { from: 'cyan-500', to: 'sky-500', hoverFrom: 'cyan-400', hoverTo: 'sky-400' },
  { from: 'fuchsia-500', to: 'pink-500', hoverFrom: 'fuchsia-400', hoverTo: 'pink-400' },
  { from: 'emerald-500', to: 'teal-500', hoverFrom: 'emerald-400', hoverTo: 'teal-400' },
  { from: 'amber-500', to: 'yellow-500', hoverFrom: 'amber-400', hoverTo: 'yellow-400' },
  { from: 'blue-500', to: 'sky-500', hoverFrom: 'blue-400', hoverTo: 'sky-400' },
  { from: 'red-500', to: 'rose-500', hoverFrom: 'red-400', hoverTo: 'rose-400' },
  { from: 'green-500', to: 'emerald-500', hoverFrom: 'green-400', hoverTo: 'emerald-400' },
  { from: 'fuchsia-500', to: 'rose-500', hoverFrom: 'fuchsia-400', hoverTo: 'rose-400' },
  { from: 'sky-500', to: 'cyan-500', hoverFrom: 'sky-400', hoverTo: 'cyan-400' },
  { from: 'lime-500', to: 'yellow-500', hoverFrom: 'lime-400', hoverTo: 'yellow-400' },
];

export const topicService = {
  async getAllTopics(): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTopicByName(name: string): Promise<Topic | null> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getOrCreateTopic(name: string): Promise<Topic> {
    const existing = await this.getTopicByName(name);
    if (existing) {
      return existing;
    }

    const { data: allTopics } = await supabase
      .from('topics')
      .select('id');

    const topicCount = allTopics?.length || 0;
    const colorIndex = topicCount % COLOR_PALETTE.length;
    const colors = COLOR_PALETTE[colorIndex];

    const { data, error } = await supabase
      .from('topics')
      .insert({
        name,
        gradient_from: colors.from,
        gradient_to: colors.to,
        hover_gradient_from: colors.hoverFrom,
        hover_gradient_to: colors.hoverTo,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async ensureTopicsExist(topicNames: string[]): Promise<Map<string, Topic>> {
    const topicMap = new Map<string, Topic>();

    for (const name of topicNames) {
      if (name) {
        try {
          const topic = await this.getOrCreateTopic(name);
          topicMap.set(name, topic);
        } catch (err) {
          console.error(`Failed to ensure topic exists: ${name}`, err);
        }
      }
    }

    return topicMap;
  },

  getColorPalette() {
    return COLOR_PALETTE;
  },

  topicToGradient(topic: Topic): TopicGradient {
    return {
      from: topic.gradient_from,
      to: topic.gradient_to,
      hoverFrom: topic.hover_gradient_from,
      hoverTo: topic.hover_gradient_to,
    };
  },
};
