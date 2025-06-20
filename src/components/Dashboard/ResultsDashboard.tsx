'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadialBarChart, RadialBar } from 'recharts';
import { AnalysisResult } from '@/types/analysis';

interface ResultsDashboardProps {
  result: AnalysisResult;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const processedData = useMemo(() => {
    if (!result) return null;
    const [user1Name, user2Name] = result.dataset_overview?.participants.names || ['User1', 'User2'];
    const responseMetrics = [
      { subject: 'Avg Response (m)', [user1Name]: result.response_metrics?.[user2Name]?.me?.avg_response_minutes || 0, [user2Name]: result.response_metrics?.[user1Name]?.other?.avg_response_minutes || 0, fullMark: 10 },
      { subject: 'Median (m)', [user1Name]: result.response_metrics?.[user2Name]?.me?.median_response_minutes || 0, [user2Name]: result.response_metrics?.[user1Name]?.other?.median_response_minutes || 0, fullMark: 1 },
      { subject: 'P90 (m)', [user1Name]: result.response_metrics?.[user2Name]?.me?.p90_response_minutes || 0, [user2Name]: result.response_metrics?.[user1Name]?.other?.p90_response_minutes || 0, fullMark: 2 },
    ];
    const relationshipScores = result.relationship_metrics?.score_components
      ? Object.entries(result.relationship_metrics.score_components).map(([name, value]) => ({
          name: name.replace('_score', '').replace(/^\w/, c => c.toUpperCase()),
          value: value,
        }))
      : [];
    return {
      user1Name, user2Name, responseMetrics, relationshipScores,
      platformData: result.dataset_overview?.chat_platforms_distribution
        ? Object.entries(result.dataset_overview.chat_platforms_distribution).map(([name, value]) => ({ name, value }))
        : [],
      hourlyData: result.temporal_patterns?.hourly_distribution
        ? Object.entries(result.temporal_patterns.hourly_distribution).map(([hour, count]) => ({ hour: `${hour.padStart(2, '0')}:00`, messages: count }))
        : [],
      dailyData: result.temporal_patterns?.daily_distribution
        ? Object.entries(result.temporal_patterns.daily_distribution).map(([day, count]) => ({ day, messages: count }))
        : [],
      sentimentTimelineData: result.sentiment_analysis?.sentiment_timeline
        ? Object.entries(result.sentiment_analysis.sentiment_timeline).map(([date, sentiment]) => ({ date: new Date(date).toLocaleDateString(), sentiment: sentiment.toFixed(4) }))
        : [],
      topTopics: result.topic_modeling?.discovered_topics?.slice(0, 5).map(topic => topic.top_words.join(', ')) || [],
    };
  }, [result]);

  if (!result || !processedData) {
    return <Card className="bg-gray-800 p-8 text-center text-gray-400">Loading analysis data...</Card>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab result={result} platformData={processedData.platformData} topTopics={processedData.topTopics} />;
      case 'behavior-content': return <BehaviorContentTab result={result} hourlyData={processedData.hourlyData} dailyData={processedData.dailyData} sentimentTimelineData={processedData.sentimentTimelineData} user1Name={processedData.user1Name} user2Name={processedData.user2Name} />;
      case 'convos-tones': return <ConvosTonesTab result={result} user1Name={processedData.user1Name} user2Name={processedData.user2Name} />;
      case 'relationship-dna': return <RelationshipDNATab result={result} responseMetrics={processedData.responseMetrics} relationshipScores={processedData.relationshipScores} user1Name={processedData.user1Name} user2Name={processedData.user2Name} />;
      default: return null;
    }
  };

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button onClick={() => setActiveTab(id)} className={`px-3 py-2 text-xs sm:px-4 sm:text-sm font-medium rounded-md transition-all duration-200 ${activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'}`}>
      {label}
    </button>
  );

  return (
    <div className="bg-gray-900 text-white p-2 sm:p-6 rounded-2xl shadow-2xl border border-gray-700/50 font-sans">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Analysis Dashboard</h2>
        <div className="flex flex-wrap gap-1 sm:gap-2 p-1 bg-gray-800 rounded-lg">
          <TabButton id="overview" label="Overview" />
          <TabButton id="behavior-content" label="Behavior & Content" />
          <TabButton id="convos-tones" label="Convos & Tones" />
          <TabButton id="relationship-dna" label="Relationship DNA" />
        </div>
      </div>
      <div className="transition-opacity duration-300">
        {renderTabContent()}
      </div>
    </div>
  );
};

// --- SHARED COMPONENTS ---
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`bg-gray-800/50 border border-gray-700/60 rounded-xl p-4 sm:p-6 shadow-lg ${className}`}>{children}</div>;
const StatCard = ({ title, value, subValue, icon, className }: { title: string; value: string; subValue?: string; icon?: string; className?: string }) => (
  <Card className={className}>
    <div className="flex items-start gap-4">
      {icon && <div className="text-3xl text-blue-400 mt-1">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-400 truncate">{title}</p>
        <p className="text-xl md:text-2xl font-bold text-white truncate">{value}</p>
        {subValue && <p className="text-xs text-gray-500 truncate">{subValue}</p>}
      </div>
    </div>
  </Card>
);
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 p-3 border border-gray-600 rounded-lg shadow-xl">
        <p className="font-bold text-white">{label}</p>
        {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>)}
      </div>
    );
  }
  return null;
};
const PlatformPieChart = ({ data }: { data: { name: string; value: number }[] }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB'];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
const ConversationTooltip = ({ messages, user1, user2 }: { messages: any[]; user1: string; user2: string }) => (
  <div className="bg-gray-900 border border-blue-500 p-4 rounded-lg shadow-2xl z-10 w-80">
    <h4 className="font-bold mb-3 text-white">Conversation Snippet</h4>
    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
      {messages.slice(0, 10).map((msg, i) => (
        <div key={i} className={`flex flex-col ${msg.sender === user1 ? 'items-start' : 'items-end'}`}>
          <div className={`px-3 py-2 rounded-2xl max-w-[85%] ${msg.sender === user1 ? 'bg-blue-600 rounded-bl-none' : 'bg-gray-600 rounded-br-none'}`}>
            <p className="text-sm text-white">{msg.message}</p>
          </div>
        </div>
      ))}
      {messages.length > 10 && <p className="text-center text-xs text-gray-500 mt-2">... and more</p>}
    </div>
  </div>
);

// --- TAB COMPONENTS ---
const OverviewTab = ({ result, platformData, topTopics }: { result: AnalysisResult; platformData: { name: string; value: number }[]; topTopics: string[] }) => {
  const starterCounts = result.icebreaker_analysis?.conversation_starter_counts || [];
  const starterLeader = starterCounts.length > 0 ? starterCounts.reduce((prev, current) => (prev.count > current.count ? prev : current)) : { user: 'N/A', count: 0 };
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <StatCard className="col-span-1" title="Total Messages" value={result.dataset_overview?.total_messages?.toLocaleString() || 'N/A'} icon="💬" />
      <StatCard className="col-span-1" title="Chatting Streak" value={`${result.unbroken_streaks?.longest_consecutive_days || 0} Days`} subValue={result.unbroken_streaks?.streak_start_date ? new Date(result.unbroken_streaks.streak_start_date).toLocaleDateString() : 'N/A'} icon="🔥" />
      <StatCard className="col-span-1" title="Conv. Starter" value={starterLeader.user} subValue={`${starterLeader.count} times`} icon="🚀" />
      <StatCard className="col-span-1" title="Relationship Score" value={`${result.relationship_metrics?.relationship_score?.toFixed(1) || 'N/A'}/100`} subValue={`Intensity: ${result.relationship_metrics?.relationship_intensity || 'N/A'}`} icon="❤️‍🔥" />
      <Card className="col-span-2 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Chat Platform Distribution</h3>
        <PlatformPieChart data={platformData} />
      </Card>
      <div className="col-span-2 lg:col-span-2 grid grid-rows-2 gap-4">
        <StatCard title="First Message" value={`"${result.first_last_messages?.first_message?.message || 'N/A'}"`} subValue={`by ${result.first_last_messages?.first_message?.sender || 'N/A'} on ${result.first_last_messages?.first_message?.datetime ? new Date(result.first_last_messages.first_message.datetime).toLocaleDateString() : 'N/A'}`} icon="🌅" />
        <StatCard title="Last Message" value={`"${result.first_last_messages?.last_message?.message || 'N/A'}"`} subValue={`by ${result.first_last_messages?.last_message?.sender || 'N/A'} on ${result.first_last_messages?.last_message?.datetime ? new Date(result.first_last_messages.last_message.datetime).toLocaleDateString() : 'N/A'}`} icon="🌃" />
      </div>
      <Card className="col-span-2 lg:col-span-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Top Conversation Topics</h3>
        <ul className="list-disc list-inside text-gray-300">
          {topTopics.map((topic, index) => <li key={index}>{topic}</li>)}
        </ul>
      </Card>
    </div>
  );
};

const BehaviorContentTab = ({ result, hourlyData, dailyData, sentimentTimelineData, user1Name, user2Name }: { result: AnalysisResult; hourlyData: any[]; dailyData: any[]; sentimentTimelineData: any[]; user1Name: string; user2Name: string }) => {
  const UserCard = ({ userName, userColor }: { userName: string; userColor: string }) => {
    const userData = result.user_behavior?.[userName];
    const wordData = result.word_analysis?.user_word_analysis?.[userName];
    const emojiData = result.emoji_analysis?.user_emoji_analysis?.[userName];
    const qData = result.question_analysis?.user_question_analysis?.[userName];
    const linkData = result.link_analysis?.links_per_user?.find(u => u.user === userName);

    if (!userData || !wordData || !emojiData || !qData) {
      return (
        <Card className={`border-t-4 ${userColor}`}>
          <h3 className="text-xl font-bold mb-4 text-center">{userName}</h3>
          <p className="text-gray-400 text-center">Data not available.</p>
        </Card>
      );
    }

    return (
      <Card className={`border-t-4 ${userColor}`}>
        <h3 className="text-xl font-bold mb-4 text-center">{userName}</h3>
        <div className="space-y-3 text-sm">
          <p><strong>Total Messages:</strong> {userData.message_counts?.total_messages?.toLocaleString() || 'N/A'}</p>
          <p><strong>Questions Asked:</strong> {qData.total_questions?.toLocaleString() || 'N/A'}</p>
          <p><strong>Links Shared:</strong> {linkData ? linkData.count : 0}</p>
          <div className="pt-2">
            <h4 className="font-semibold">Top 5 Words:</h4>
            <ol className="list-decimal list-inside text-gray-400">
              {wordData.top_20_words?.slice(0, 5).map(w => <li key={w.word}>{w.word} ({w.count})</li>)}
            </ol>
          </div>
          <div className="pt-2">
            <h4 className="font-semibold">Top 5 Emojis:</h4>
            <div className="flex gap-3 text-2xl">
              {emojiData.top_10_emojis?.slice(0, 5).map(e => <span key={e.emoji} title={`${e.emoji} (${e.count})`}>{e.emoji}</span>)}
            </div>
          </div>
        </div>
      </Card>
    );
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Hourly Messages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="messages" fill="#3b82f6" name="Messages" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-200">Daily Messages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="messages" fill="#8b5cf6" name="Messages" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Sentiment Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sentimentTimelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="sentiment" stroke="#82ca9d" name="Sentiment" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Lifestyle Habits</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-3xl font-bold">{result.temporal_patterns?.night_owl_percentage?.toFixed(1) || 'N/A'}%</p><p className="text-sm text-gray-400">Night Owl</p></div>
          <div><p className="text-3xl font-bold">{result.temporal_patterns?.early_bird_percentage?.toFixed(1) || 'N/A'}%</p><p className="text-sm text-gray-400">Early Bird</p></div>
          <div><p className="text-3xl font-bold">{result.temporal_patterns?.weekend_activity_percentage?.toFixed(1) || 'N/A'}%</p><p className="text-sm text-gray-400">Weekend Activity</p></div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserCard userName={user1Name} userColor="border-blue-500" />
        <UserCard userName={user2Name} userColor="border-purple-500" />
      </div>
    </div>
  );
};

const ConvosTonesTab = ({ result, user1Name, user2Name }: { result: AnalysisResult; user1Name: string; user2Name: string }) => (
  <div className="space-y-6">
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Most Intense Conversations</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
            <tr>
              <th className="px-4 py-3">Intensity</th>
              <th className="px-4 py-3"># Msgs</th>
              <th className="px-4 py-3">Duration (m)</th>
              <th className="px-4 py-3">Avg Response (s)</th>
              <th className="px-4 py-3">Msgs/Hour</th>
              <th className="px-4 py-3">Start Time</th>
            </tr>
          </thead>
          <tbody>
            {result.conversation_patterns?.most_intense_conversations?.slice(0, 5).map(c => (
              <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700/50 group relative">
                <td className="px-4 py-3 font-medium text-white">{c.intensity_score?.toFixed(2) || 'N/A'}</td>
                <td className="px-4 py-3">{c.message_count || 'N/A'}</td>
                <td className="px-4 py-3">{c.duration_minutes?.toFixed(2) || 'N/A'}</td>
                <td className="px-4 py-3">{c.avg_response_time_seconds?.toFixed(2) || 'N/A'}</td>
                <td className="px-4 py-3">{c.messages_per_hour?.toFixed(2) || 'N/A'}</td>
                <td className="px-4 py-3">{c.start_time ? new Date(c.start_time).toLocaleString() : 'N/A'}</td>
                <td className="absolute hidden group-hover:block -top-8 right-0 z-20">
                  <ConversationTooltip messages={c.sample_messages || []} user1={user1Name} user2={user2Name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Top Rapid-Fire Sessions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
            <tr>
              <th className="px-4 py-3">Msgs/Min</th>
              <th className="px-4 py-3">Total Msgs</th>
              <th className="px-4 py-3">Start Time</th>
            </tr>
          </thead>
          <tbody>
            {result.rapid_fire_analysis?.top_10_sessions?.slice(0, 5).map(c => (
              <tr key={c.start_time} className="border-b border-gray-700 hover:bg-gray-700/50 group relative">
                <td className="px-4 py-3 font-medium text-white">{c.messages_per_minute?.toFixed(2) || 'N/A'}</td>
                <td className="px-4 py-3">{c.total_messages || 'N/A'}</td>
                <td className="px-4 py-3">{c.start_time ? new Date(c.start_time).toLocaleString() : 'N/A'}</td>
                <td className="absolute hidden group-hover:block -top-8 right-0 z-20">
                  <ConversationTooltip messages={c.sample_messages || []} user1={user1Name} user2={user2Name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Ghosting Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div><p className="text-3xl font-bold">{result.ghost_periods?.total_ghost_periods || 'N/A'}</p><p className="text-sm text-gray-400">Total Ghost Periods</p></div>
        <div><p className="text-3xl font-bold">{result.ghost_periods?.average_ghost_duration_hours?.toFixed(1) || 'N/A'} hrs</p><p className="text-sm text-gray-400">Avg. Silence Duration</p></div>
        <div><p className="text-3xl font-bold">{result.ghost_periods?.who_breaks_silence_most?.[0]?.user || 'N/A'}</p><p className="text-sm text-gray-400">Usually Breaks Silence</p></div>
      </div>
    </Card>
  </div>
);

const RelationshipDNATab = ({ result, responseMetrics, relationshipScores, user1Name, user2Name }: { result: AnalysisResult; responseMetrics: any[]; relationshipScores: any[]; user1Name: string; user2Name: string }) => (
  <div className="space-y-6">
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-200 text-center">Relationship Score DNA</h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={15} data={relationshipScores} startAngle={180} endAngle={-180}>
          <PolarGrid gridType="polygons" polarRadius={[10, 20, 40, 60]} stroke="#e2e8f0" />
          <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10}>
            {relationshipScores.map((entry, index) => <Cell key={`cell-${index}`} fill={['#4a90e2', '#50e3c2', '#f5a623', '#d0021b'][index % 4]} />)}
          </RadialBar>
          <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: '#e2e8f0' }} />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#e2e8f0' }} />
        </RadialBarChart>
      </ResponsiveContainer>
    </Card>
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-200 text-center">Response Time Breakdown</h3>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={responseMetrics}>
          <PolarGrid stroke="#4a5568" />
          <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={12} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#4a5568" />
          <Tooltip content={<CustomTooltip />} />
          <Radar name={user1Name} dataKey={user1Name} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
          <Radar name={user2Name} dataKey={user2Name} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-gray-200 text-center">Argument Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h4 className="font-bold mb-2 text-center text-blue-400">{user1Name}'s Top Argument Words</h4>
          <ol className="list-decimal list-inside text-gray-300 text-center">
            {result.argument_analysis?.user_argument_stats?.[user1Name]?.words_used?.slice(0, 3).map(w => <li key={w[0]}>{w[0]} <span className="text-gray-500">({w[1]})</span></li>) || <li>N/A</li>}
          </ol>
        </div>
        <div>
          <h4 className="font-bold mb-2 text-center text-purple-400">{user2Name}'s Top Argument Words</h4>
          <ol className="list-decimal list-inside text-gray-300 text-center">
            {result.argument_analysis?.user_argument_stats?.[user2Name]?.words_used?.slice(0, 3).map(w => <li key={w[0]}>{w[0]} <span className="text-gray-500">({w[1]})</span></li>) || <li>N/A</li>}
          </ol>
        </div>
      </div>
    </Card>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-pink-400">Top Romantic Message</h3>
        <p className="text-sm text-gray-300 italic">"{result.romance_tone_analysis?.top_messages?.[0]?.message || 'N/A'}"</p>
        <p className="text-xs text-right mt-2 text-pink-400">- {result.romance_tone_analysis?.top_messages?.[0]?.sender || 'N/A'}</p>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-blue-400">Top Sad Message</h3>
        <p className="text-sm text-gray-300 italic">"{result.sad_tone_analysis?.top_messages?.[0]?.message || 'N/A'}"</p>
        <p className="text-xs text-right mt-2 text-blue-400">- {result.sad_tone_analysis?.top_messages?.[0]?.sender || 'N/A'}</p>
      </Card>
    </div>
  </div>
);