import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-xl font-bold">Something went wrong on this page</h2>
            <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => this.setState({ error: null })}>Try again</Button>
              <Button variant="outline" onClick={() => window.location.assign("/")}>Go home</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
