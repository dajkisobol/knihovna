import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetData = () => {
    if (window.confirm('Opravdu chcete vyresetovat lokální uložení aplikace? Vaše uložené knihy mohou být smazány.')) {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 font-sans text-stone-800">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-amber-200 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-stone-900">
              Něco se nepodařilo načíst
            </h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              V aplikaci došlo k neočekávané chybě. Můžete zkusit obnovit stránku nebo resetovat lokální data.
            </p>

            {this.state.error?.message && (
              <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-left overflow-auto max-h-28 text-[11px] font-mono text-stone-700">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
              >
                Obnovit stránku
              </button>
              <button
                onClick={this.handleResetData}
                className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl border border-stone-200 transition cursor-pointer"
              >
                Vyresetovat data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
