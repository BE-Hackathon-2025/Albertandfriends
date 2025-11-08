import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Lock, Receipt, ArrowLeft, Edit2, Save, X } from "lucide-react";
import Header from "@/components/Header";

interface Profile {
  full_name: string | null;
  phone: string | null;
  address: string | null;
}

interface ReceiptData {
  id: string;
  store_name: string | null;
  total_amount: number | null;
  receipt_date: string | null;
  created_at: string;
  image_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    phone: "",
    address: "",
  });
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ store_name: string; total_amount: string }>({ store_name: "", total_amount: "" });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setEmail(user.email || "");
    await loadProfile(user.id);
    await loadReceipts(user.id);
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("full_name, phone, address")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    if (data) {
      setProfile(data);
    }
  };

  const loadReceipts = async (userId: string) => {
    const { data, error } = await (supabase as any)
      .from("receipts")
      .select("id, store_name, total_amount, receipt_date, created_at, image_url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading receipts:", error);
      return;
    }

    if (data) {
      setReceipts(data);
    }
  };

  const handleEditReceipt = (receipt: ReceiptData) => {
    setEditingId(receipt.id);
    setEditValues({
      store_name: receipt.store_name || "",
      total_amount: receipt.total_amount?.toString() || "0",
    });
  };

  const handleSaveReceipt = async (receiptId: string) => {
    setUpdating(true);
    const { error } = await (supabase as any)
      .from("receipts")
      .update({
        store_name: editValues.store_name,
        total_amount: parseFloat(editValues.total_amount) || 0,
      })
      .eq("id", receiptId);

    setUpdating(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Update local state
    setReceipts(receipts.map(r => 
      r.id === receiptId 
        ? { ...r, store_name: editValues.store_name, total_amount: parseFloat(editValues.total_amount) }
        : r
    ));

    setEditingId(null);
    toast({
      title: "Success",
      description: "Receipt updated successfully",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ store_name: "", total_amount: "" });
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
      })
      .eq("id", user.id);

    setUpdating(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const handleUpdateEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ email });
    setUpdating(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Email updated successfully. Please check your inbox to confirm.",
    });
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdating(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewPassword("");
    toast({
      title: "Success",
      description: "Password updated successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <h1 className="text-3xl font-bold mb-6">My Profile</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="receipts">
              <Receipt className="mr-2 h-4 w-4" />
              Receipts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address || ""}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Enter your address"
                  />
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={updating}
                  className="w-full"
                >
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Address</CardTitle>
                  <CardDescription>
                    Update your email address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>

                  <Button
                    onClick={handleUpdateEmail}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Email
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>

                  <Button
                    onClick={handleUpdatePassword}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="receipts">
            <Card>
              <CardHeader>
                <CardTitle>My Receipts</CardTitle>
                <CardDescription>
                  View all your uploaded receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {receipts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No receipts yet. Upload your first receipt to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {receipts.map((receipt, index) => (
                      <div key={receipt.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="py-4 flex justify-between items-start gap-4">
                          <div className="flex-1">
                            {editingId === receipt.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={editValues.store_name}
                                  onChange={(e) => setEditValues({ ...editValues, store_name: e.target.value })}
                                  placeholder="Store name"
                                  className="font-medium"
                                />
                                <Input
                                  value={editValues.total_amount}
                                  onChange={(e) => setEditValues({ ...editValues, total_amount: e.target.value })}
                                  placeholder="0.00"
                                  type="number"
                                  step="0.01"
                                  className="text-lg font-semibold w-32"
                                />
                                <p className="text-sm text-muted-foreground">
                                  {receipt.receipt_date
                                    ? new Date(receipt.receipt_date).toLocaleDateString()
                                    : new Date(receipt.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveReceipt(receipt.id)}
                                    disabled={updating}
                                  >
                                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={updating}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-lg">
                                    {receipt.store_name || "Unknown Store"}
                                  </p>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleEditReceipt(receipt)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-2xl font-semibold">
                                  ${receipt.total_amount?.toFixed(2) || "0.00"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {receipt.receipt_date
                                    ? new Date(receipt.receipt_date).toLocaleDateString()
                                    : new Date(receipt.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {receipt.image_url && (
                            <div className="w-32 h-32 flex-shrink-0">
                              <img
                                src={receipt.image_url}
                                alt="Receipt"
                                className="w-full h-full object-cover rounded-lg border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
