import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";

export default function Handler(props: any) {
  return <StackHandler app={stackServerApp} {...props} />;
}
