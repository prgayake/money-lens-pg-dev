import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, Chrome } from "lucide-react";

function Login() {
  const { loginWithGoogle, loading, error } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to Money Lens
          </CardTitle>
          <CardDescription>
            Your AI-powered financial assistant. Sign in to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full h-12 text-base"
            variant="outline"
          >
            <Chrome className="w-5 h-5 mr-2" />
            {loading ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>
              By signing in, you agree to our terms of service and privacy
              policy.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              What you'll get:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Personalized financial insights</li>
              <li>• Chat history across devices</li>
              <li>• Secure data storage</li>
              <li>• Advanced AI recommendations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
