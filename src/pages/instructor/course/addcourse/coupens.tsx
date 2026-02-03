import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../../components/ui/alert-dialog';
import { Plus, Edit, Trash2, Calendar,  Eye, EyeOffIcon, FileIcon } from 'lucide-react';
import { Switch } from '../../../../components/ui/switch';
import { useAuth } from '../../../../context/AuthContext';
import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { UnifiedCoupon, getInstructorCoupons,  createOrUpdateCoupon, deleteCoupon } from '../../../../utils/firebaseCourseCoupens';

type FormState = {
  id?: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  minAmount: string;
  maxDiscount: string;
  maxUses: string;
  maxUsesPerUser: string;
  applicablePlans: string;
  categories: string;
  subCategories: string;
  isAllCategories: boolean;
  isAllSubCategories: boolean;
  isGlobal: boolean;
  autoApply: boolean;
  priority: string;
  usedCount: string;
};

export default function CourseCouponsPage({onSubmit}:{onSubmit?: any }) {
  const [coupons, setCoupons] = useState<UnifiedCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<UnifiedCoupon | null>(null);
  const { user } = useAuth();
  const draftIdLS = localStorage.getItem('draftId') || '';

  const [formData, setFormData] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '0',
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date().toISOString().split('T')[0],
    minAmount: '0',
    maxDiscount: '',
    maxUses: '0',
    maxUsesPerUser: '1',
    applicablePlans: '',
    categories: '',
    subCategories: '',
    isAllCategories: true,
    isAllSubCategories: true,
  isGlobal: user?.UserName === 'admin',
    autoApply: false,
    priority: '0',
    usedCount: '0'
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '0',
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date().toISOString().split('T')[0],
      minAmount: '0',
      maxDiscount: '',
      maxUses: '0',
      maxUsesPerUser: '1',
      applicablePlans: '',
      categories: '',
      subCategories: '',
      isAllCategories: true,
      isAllSubCategories: true,
      isGlobal: false,
      autoApply: false,
      priority: '0',
      usedCount: '0'
    });
    setEditingCoupon(null);
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
  if  (user?.UserName) {
        const data = await getInstructorCoupons(user.UserName,draftIdLS);
        setCoupons(data);
      }
    } catch (error) {
      console.error('Failed to load coupons', error);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCoupons(); }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.UserName) return;
  const id = editingCoupon?.id || Date.now().toString();
  // Import Timestamp from Firestore
  // import { Timestamp } from 'firebase/firestore'; (ensure this import is at the top if not already)
  const couponObj = {
    id,
    code: formData.code.toUpperCase(),
    name: formData.name,
    description: formData.description,
    type: formData.type,
    value: Number(formData.value),
    isActive: formData.isActive,
    createdAt: (editingCoupon?.createdAt as any) || new Date(),
    updatedAt: new Date(),
    validFrom: new Date(formData.validFrom),
    validUntil: new Date(formData.validUntil),
    usedCount: Number(formData.usedCount || 0),
    maxUses: Number(formData.maxUses || 0),
    maxUsesPerUser: Number(formData.maxUsesPerUser || 1),
    minAmount: Number(formData.minAmount || 0),
    maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
    createdBy: user.UserName,
    creatorType: user?.UserName === 'admin' ? 'admin' : 'instructor',
    isGlobal: formData.isGlobal,
    scope: formData.isGlobal ? 'global' : 'course',
    applicablePlans: formData.applicablePlans ? formData.applicablePlans.split(',').map(s => s.trim()) : [],
    categories: formData.categories ? formData.categories.split(',').map(s => s.trim()) : [],
    subCategories: formData.subCategories ? formData.subCategories.split(',').map(s => s.trim()) : [],
    isAllCategories: formData.isAllCategories,
    isAllSubCategories: formData.isAllSubCategories,
    courseId: editingCoupon?.courseId??draftIdLS,
    instructorId: user?.UserName && user.UserName !== 'admin' ? user.UserName : editingCoupon?.instructorId,
    autoApply: formData.autoApply,
    priority: Number(formData.priority || 0)
  };

  const coupon = couponObj as unknown as UnifiedCoupon;

    const ok = await createOrUpdateCoupon(coupon);
    if (ok) { await loadCoupons(); resetForm(); setShowForm(false); }
    else alert('Failed to save coupon');
  };

  const handleEdit = (coupon: UnifiedCoupon) => {
    setEditingCoupon(coupon);
  setFormData({
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value.toString(),
      isActive: coupon.isActive,
  validFrom: (coupon.validFrom && (coupon.validFrom as any).toDate) ? (coupon.validFrom as any).toDate().toISOString().split('T')[0] : new Date(coupon.validFrom as any).toISOString().split('T')[0],
  validUntil: (coupon.validUntil && (coupon.validUntil as any).toDate) ? (coupon.validUntil as any).toDate().toISOString().split('T')[0] : new Date(coupon.validUntil as any).toISOString().split('T')[0],
      minAmount: coupon.minAmount?.toString() || '0',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      maxUses: coupon.maxUses?.toString() || '0',
      maxUsesPerUser: coupon.maxUsesPerUser?.toString() || '1',
      applicablePlans: (coupon.applicablePlans || []).join(', '),
      categories: (coupon.categories || []).join(', '),
      subCategories: (coupon.subCategories || []).join(', '),
      isAllCategories: coupon.isAllCategories,
      isAllSubCategories: coupon.isAllSubCategories,
      isGlobal: coupon.isGlobal,
      autoApply: coupon.autoApply,
      priority: coupon.priority?.toString() || '0',
      usedCount: coupon.usedCount?.toString() || '0'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    //if (!confirm('Delete this coupon?')) return;
    const ok = await deleteCoupon(id);
    if (ok) await loadCoupons(); else alert('Failed to delete');
  };

  const toggleCouponStatus = async (id: string) => {
    const c = coupons.find(x => x.id === id);
    if (!c) return;
  const updated = { ...c, isActive: !c.isActive, updatedAt: new Date() } as UnifiedCoupon;
    const ok = await createOrUpdateCoupon(updated);
    if (ok) await loadCoupons(); else alert('Failed to update status');
  };

  const copyToClipboard = (code: string) => { navigator.clipboard.writeText(code); };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, code: result });
  };

  const formatDate = (tsOrStr: any) => {
    try {
      const d = tsOrStr && tsOrStr.toDate ? tsOrStr.toDate() : new Date(tsOrStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return '' }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Coupons</h1>
        <p className="text-gray-600">Create and manage discount coupons for your course</p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-sm">{coupons.length} Total Coupons</Badge>
          <Badge variant="default" className="text-sm">{coupons.filter(c => c.isActive).length} Active</Badge>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Coupon Form */}
      {showForm && (
        <Card className="mb-8 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="code">Coupon Code *</label>
                  <div className="flex space-x-2">
                    <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="Enter coupon code" className="font-mono" />
                    <Button type="button" variant="outline" onClick={generateCouponCode}>Generate</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label>Discount Type *</label>
                  <Select value={formData.type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="value">Discount Value * {formData.type === 'percentage' ? '(%)' : '(₹)'}</label>
                  <Input id="value" type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder={formData.type === 'percentage' ? '50' : '25.00'} min="0" max={formData.type === 'percentage' ? '100' : undefined} step={formData.type === 'fixed' ? '0.01' : '1'} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxUses">Usage Limit *</label>
                  <Input id="maxUses" type="number" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })} placeholder="100" min="1" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="validFrom">Start Date *</label>
                  <div className="relative">
                    <Input id="validFrom" type="date" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} className="pl-10" />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="validUntil">End Date *</label>
                  <div className="relative">
                    <Input id="validUntil" type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} className="pl-10" />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="minAmount">Minimum Purchase (₹)</label>
                  <Input id="minAmount" type="number" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
                </div>

                {formData.type === 'percentage' && (
                  <div className="space-y-2">
                    <label htmlFor="maxDiscount">Maximum Discount (₹)</label>
                    <Input id="maxDiscount" type="number" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} placeholder="100.00" min="0" step="0.01" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="description">Description</label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of this coupon..." rows={3} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                <label htmlFor="isActive">Active (users can use this coupon)</label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={!formData.code || !formData.value || !formData.maxUses}>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupons List */}
      <div className="grid gap-6">
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4"><Plus className="w-12 h-12 mx-auto" /></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons created yet</h3>
              <p className="text-gray-600 mb-4">Create your first coupon to start offering discounts</p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Create Your First Coupon</Button>
            </CardContent>
          </Card>
        ) : (
          coupons.map((coupon) => (
            <Card key={coupon.id} className={`${!coupon.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <code className="text-lg font-bold bg-gray-100 px-3 py-1 rounded">{coupon.code}</code>
                      <div className="flex items-center space-x-2">
                        <Badge variant={coupon.isActive ? "default" : "secondary"}>{coupon.isActive ? <Eye className="w-3 h-3 mr-1" /> : <EyeOffIcon className="w-3 h-3 mr-1" />}{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
                        <Badge variant="outline">{coupon.type === 'percentage' ? `${coupon.value}% off` : `${coupon.value} off`}</Badge>
                      </div>
                    </div>

                    {coupon.description && (<p className="text-gray-600 mb-3">{coupon.description}</p>)}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Valid Period:</span>
                        <p>{formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Usage:</span>
                        <p>{coupon.usedCount} / {coupon.maxUses}</p>
                      </div>
                      {coupon.minAmount !== undefined && (
                        <div>
                          <span className="font-medium text-gray-500">Min Purchase:</span>
                          <p>₹{coupon.minAmount}</p>
                        </div>
                      )}
                      {coupon.maxDiscount && (
                        <div>
                          <span className="font-medium text-gray-500">Max Discount:</span>
                          <p>₹{coupon.maxDiscount}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Usage Progress</span><span>{Math.round((coupon.usedCount / Math.max(coupon.maxUses,1)) * 100)}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min((coupon.usedCount / Math.max(coupon.maxUses,1)) * 100, 100)}%` }}></div></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(coupon.code)} title="Copy coupon code"><FileIcon className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => toggleCouponStatus(coupon.id)} title={coupon.isActive ? 'Deactivate' : 'Activate'}>{coupon.isActive ? <EyeOffIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)} title="Edit coupon"><Edit className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Coupon</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the coupon "{coupon.code}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(coupon.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {coupons.length > 0 && (
        <Card className="mt-8">
          <CardHeader><CardTitle className="text-lg">Coupon Statistics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg"><div className="text-2xl font-bold text-blue-600">{coupons.length}</div><div className="text-sm text-blue-600">Total Coupons</div></div>
              <div className="p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-600">{coupons.filter(c => c.isActive).length}</div><div className="text-sm text-green-600">Active Coupons</div></div>
              <div className="p-4 bg-purple-50 rounded-lg"><div className="text-2xl font-bold text-purple-600">{coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}</div><div className="text-sm text-purple-600">Total Uses</div></div>
              <div className="p-4 bg-orange-50 rounded-lg"><div className="text-2xl font-bold text-orange-600">{coupons.reduce((sum, c) => sum + (c.maxUses || 0), 0)}</div><div className="text-sm text-orange-600">Total Capacity</div></div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex justify-end mt-2">
        <Button 
          onClick={onSubmit}
          className="px-8"
        >
          
          Continue
        </Button>
      </div>
    </div>
  );
}