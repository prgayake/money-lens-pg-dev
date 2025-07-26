import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  QrCode, 
  Smartphone, 
  Shield, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Loader2
} from "lucide-react";

const AuthenticationModal = ({ 
  isOpen, 
  onClose, 
  authUrl, 
  sessionId,
  onAuthSuccess,
  isLoading = false 
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState("phone"); // phone, qr, waiting, success
  const [copied, setCopied] = useState(false);

  const handlePhoneSubmit = () => {
    if (phoneNumber.length === 10) {
      setStep("qr");
    }
  };

  const copyAuthUrl = async () => {
    if (authUrl) {
      try {
        await navigator.clipboard.writeText(authUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy URL:", err);
      }
    }
  };

  const openAuthUrl = () => {
    if (authUrl) {
      window.open(authUrl, '_blank', 'noopener,noreferrer');
      setStep("waiting");
    }
  };

  const handleClose = () => {
    setStep("phone");
    setPhoneNumber("");
    setCopied(false);
    onClose();
  };

  const renderPhoneStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Connect Your Fi Money Account</h3>
        <p className="text-sm text-muted-foreground">
          Enter your registered mobile number to authenticate with Fi Money
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mobile Number</label>
              <Input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="mt-1"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This should be the number registered with your Fi Money account
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Your data is encrypted and secure</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3" />
                <span>No passwords or sensitive data stored</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handlePhoneSubmit} 
          disabled={phoneNumber.length !== 10 || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );

  const renderQRStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <QrCode className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Scan QR Code with Fi Money App</h3>
        <p className="text-sm text-muted-foreground">
          Open the Fi Money app on your phone and scan the QR code or click the link below
        </p>
      </div>

      {authUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Authentication URL</CardTitle>
            <CardDescription>
              Click to open in Fi Money app or copy the link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-xs break-all">{authUrl}</code>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={openAuthUrl} className="flex-1 gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Fi Money
              </Button>
              <Button variant="outline" onClick={copyAuthUrl} className="gap-2">
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-medium">What happens next?</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Fi Money app will open for authentication</li>
              <li>• Complete the login process in the app</li>
              <li>• Return to this page automatically</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Troubleshooting</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Ensure Fi Money app is installed</li>
              <li>• Check your internet connection</li>
              <li>• Try refreshing if authentication fails</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => setStep("phone")} className="flex-1">
          Back
        </Button>
      </div>
    </div>
  );

  const renderWaitingStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Waiting for Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Complete the login process in the Fi Money app
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-3">
            <Badge variant="secondary" className="text-xs">
              Session ID: {sessionId?.slice(-8) || "Loading..."}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Once you complete authentication in the Fi Money app, 
              this page will automatically update with your financial data.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Keep this window open during authentication</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => setStep("qr")} className="flex-1">
          Back to QR
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Authentication Successful!</h3>
          <p className="text-sm text-muted-foreground">
            Your Fi Money account has been connected successfully
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-3">
            <Badge variant="success" className="text-xs">
              Connected
            </Badge>
            <p className="text-sm text-muted-foreground">
              You can now access all your financial data and insights through the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onAuthSuccess} className="w-full">
        Continue to Dashboard
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case "phone": return renderPhoneStep();
      case "qr": return renderQRStep();
      case "waiting": return renderWaitingStep();
      case "success": return renderSuccessStep();
      default: return renderPhoneStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle>Fi Money Authentication</DialogTitle>
          <DialogDescription>
            Securely connect your Fi Money account to access your financial data
          </DialogDescription>
        </DialogHeader>
        
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthenticationModal;
