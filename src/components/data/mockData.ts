export const posts = [
  {
    id: "1",
    author: { name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?img=5", title: "Product Designer at Figma", initials: "SC" },
    content: "Just shipped a major redesign of our design system. It's been months of iteration, user testing, and late nights. The result? A 40% improvement in design-to-code consistency. Sometimes the best features are the ones users never notice — because everything just works.",
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=400&fit=crop",
    time: "2h ago",
    likes: 234,
    comments: 42,
  },
  {
    id: "2",
    author: { name: "Marcus Williams", avatar: "https://i.pravatar.cc/150?img=8", title: "Senior Engineer at Stripe", initials: "MW" },
    content: "Hot take: The best code is the code you don't write. Spent the morning removing 3,000 lines of legacy code. The app is faster, more maintainable, and the tests actually pass now. Refactoring > new features (sometimes).",
    time: "4h ago",
    likes: 891,
    comments: 156,
  },
  {
    id: "3",
    author: { name: "Elena Rodriguez", avatar: "https://i.pravatar.cc/150?img=9", title: "Startup Founder & CEO", initials: "ER" },
    content: "We just closed our Series A! 🎉 Two years ago I was coding in my apartment with zero funding. Today we have an incredible team of 25 and the resources to truly scale our vision. Grateful for everyone who believed in us early on.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop",
    time: "6h ago",
    likes: 1502,
    comments: 298,
  },
  {
    id: "4",
    author: { name: "David Park", avatar: "https://i.pravatar.cc/150?img=11", title: "ML Research Scientist", initials: "DP" },
    content: "Published our latest paper on efficient transformer architectures. We managed to reduce inference costs by 60% while maintaining comparable accuracy. The future of AI isn't just about bigger models — it's about smarter ones.",
    time: "8h ago",
    likes: 445,
    comments: 87,
  },
];

export const suggestedUsers = [
  { name: "Aisha Patel", title: "UX Researcher", avatar: "https://i.pravatar.cc/150?img=1", initials: "AP" },
  { name: "James Liu", title: "Full Stack Dev", avatar: "https://i.pravatar.cc/150?img=3", initials: "JL" },
  { name: "Olivia Foster", title: "Data Scientist", avatar: "https://i.pravatar.cc/150?img=10", initials: "OF" },
  { name: "Noah Kim", title: "Product Manager", avatar: "https://i.pravatar.cc/150?img=7", initials: "NK" },
];

export const trendingTopics = [
  { tag: "#TechInnovation", posts: "12.4K posts" },
  { tag: "#RemoteWork", posts: "8.9K posts" },
  { tag: "#AIFuture", posts: "15.2K posts" },
  { tag: "#StartupLife", posts: "6.7K posts" },
  { tag: "#DesignSystems", posts: "3.1K posts" },
];

export const notifications = [
  { id: "1", type: "like" as const, user: "Sarah Chen", avatar: "https://i.pravatar.cc/150?img=5", message: "liked your post", time: "5m ago" },
  { id: "2", type: "comment" as const, user: "Marcus Williams", avatar: "https://i.pravatar.cc/150?img=8", message: "commented on your post", time: "15m ago" },
  { id: "3", type: "follow" as const, user: "Elena Rodriguez", avatar: "https://i.pravatar.cc/150?img=9", message: "started following you", time: "1h ago" },
  { id: "4", type: "mention" as const, user: "David Park", avatar: "https://i.pravatar.cc/150?img=11", message: "mentioned you in a comment", time: "2h ago" },
  { id: "5", type: "like" as const, user: "Aisha Patel", avatar: "https://i.pravatar.cc/150?img=1", message: "liked your comment", time: "3h ago" },
];

export const messages = [
  { id: "1", user: "Sarah Chen", avatar: "https://i.pravatar.cc/150?img=5", lastMessage: "That sounds great! Let's catch up this week.", time: "2m ago", unread: true, initials: "SC" },
  { id: "2", user: "Marcus Williams", avatar: "https://i.pravatar.cc/150?img=8", lastMessage: "Did you see the new API docs?", time: "1h ago", unread: true, initials: "MW" },
  { id: "3", user: "Elena Rodriguez", avatar: "https://i.pravatar.cc/150?img=9", lastMessage: "Thanks for the introduction!", time: "3h ago", unread: false, initials: "ER" },
  { id: "4", user: "David Park", avatar: "https://i.pravatar.cc/150?img=11", lastMessage: "The paper is ready for review.", time: "1d ago", unread: false, initials: "DP" },
];
