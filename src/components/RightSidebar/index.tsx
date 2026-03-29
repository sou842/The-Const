import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { suggestedUsers, trendingTopics } from "@/data/mockData";

const RightSidebar = () => (
  <aside className="pt-14 hidden xl:block w-80 border-l bg-card p-4 overflow-y-auto">
    <div className="mb-6">
      <h3 className="font-display font-semibold text-sm mb-3">Trending Topics</h3>
      <div className="space-y-2.5">
        {trendingTopics.map((topic) => (
          <div key={topic.tag} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{topic.tag}</p>
              <p className="text-xs text-muted-foreground">{topic.posts}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="font-display font-semibold text-sm mb-3">People You May Know</h3>
      <div className="space-y-3">
        {suggestedUsers.map((user) => (
          <div key={user.name} className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.title}</p>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs shrink-0">
              Connect
            </Button>
          </div>
        ))}
      </div>

      {/* <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Have a story to share?{" "}
          <Link href="/write" className="text-primary font-medium hover:underline">
            Write a blog
          </Link>
        </p>
      </div> */}
    </div>
  </aside>
);

export default RightSidebar;