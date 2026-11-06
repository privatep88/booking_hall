import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History, Search, Shield, Filter, Calendar, Trash2 } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, clearAllLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CANCEL':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'DELETE':
        return 'bg-red-100 text-red-900 border-red-300 font-black';
      case 'CHECK_IN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CHECK_OUT':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'MAINTENANCE_TOGGLE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              سجل التدقيق والعمليات (System Audit Log)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              توثيق شامل لكافة العمليات المنفذة على الحجوزات والقاعات والإعدادات مع الوقت وهوية المستخدم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg border text-slate-700 font-semibold">
            إجمالي العمليات المسجلة: {auditLogs.length}
          </div>
          {auditLogs.length > 0 && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إفراغ السجل</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث في التفاصيل، اسم المستخدم، رقم السجل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
          >
            <option value="all">جميع أنواع العمليات</option>
            <option value="CREATE">إنشاء حجز جديد (CREATE)</option>
            <option value="UPDATE">تعديل حجز (UPDATE)</option>
            <option value="CANCEL">إلغاء حجز (CANCEL)</option>
            <option value="DELETE">حذف نهائي لحجز ملغي (DELETE)</option>
            <option value="CHECK_IN">تسجيل حضور (CHECK_IN)</option>
            <option value="CHECK_OUT">إنهاء اجتماع (CHECK_OUT)</option>
            <option value="MAINTENANCE_TOGGLE">صيانة القاعات (MAINTENANCE)</option>
            <option value="SETTINGS_UPDATE">إعدادات النظام (SETTINGS)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            لا توجد سجلات تدقيق تطابق معايير البحث.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 text-start">الوقت والتاريخ</th>
                  <th className="p-3 text-start">المستخدم المنفذ</th>
                  <th className="p-3 text-center">نوع العملية</th>
                  <th className="p-3 text-start">الكيان</th>
                  <th className="p-3 text-start">تفاصيل العملية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('ar-AE')}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {log.userName}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {log.entity}
                    </td>
                    <td className="p-3 text-slate-800 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">إفراغ سجل التدقيق والعمليات</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">هل أنت متأكد من رغبتك في إفراغ وحذف جميع سجلات العمليات والأنشطة كلياً؟</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllLogs();
                  setShowConfirmModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                تأكيد الإفراغ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
