import { X, CreditCard, Banknote, Smartphone } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (method: string) => void;
}

const PaymentModal = ({ isOpen, total, onClose, onConfirm }: PaymentModalProps) => {
  if (!isOpen) return null;

  const paymentMethods = [
    { id: "Numerário", label: "Numerário", icon: Banknote, color: "bg-green-100 text-green-600" },
    { id: "Cartão", label: "Multibanco", icon: CreditCard, color: "bg-blue-100 text-blue-600" },
    { id: "MB Way", label: "MB Way", icon: Smartphone, color: "bg-red-100 text-red-600" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Pagamento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <p className="text-gray-500 mb-1">Total a Pagar</p>
            <p className="text-4xl font-black text-gray-900">
              {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(total)}
            </p>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => onConfirm(method.id)}
                className="w-full flex items-center p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className={`p-3 rounded-lg ${method.color} mr-4 group-hover:scale-110 transition-transform`}>
                  <method.icon size={24} />
                </div>
                <span className="font-bold text-gray-700 text-lg">{method.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
