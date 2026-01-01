import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startConversation, StartConversationDto } from '../../api/messaging';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  responsableUserId?: string;
  reclamationId?: number;
  interventionId?: number;
  defaultSubject?: string;
  onConversationCreated?: (conversationId: number) => void;
}

const StartConversationModal: React.FC<StartConversationModalProps> = ({
  isOpen,
  onClose,
  responsableUserId,
  reclamationId,
  interventionId,
  defaultSubject,
  onConversationCreated
}) => {
  const queryClient = useQueryClient();
  const [sujet, setSujet] = useState(defaultSubject || '');
  const [messageInitial, setMessageInitial] = useState('');

  const startConversationMutation = useMutation({
    mutationFn: (dto: StartConversationDto) => startConversation(dto, responsableUserId),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onConversationCreated?.(conversation.id);
      onClose();
      setSujet('');
      setMessageInitial('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInitial.trim()) return;

    startConversationMutation.mutate({
      sujet: sujet.trim() || undefined,
      messageInitial: messageInitial.trim(),
      reclamationId,
      interventionId
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative inline-block w-full max-w-lg p-6 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600" />
              Nouvelle conversation
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Subject */}
            <div className="mb-4">
              <label htmlFor="sujet" className="block text-sm font-medium text-slate-700 mb-1.5">
                Sujet (optionnel)
              </label>
              <input
                type="text"
                id="sujet"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Ex: Question sur ma réclamation"
                className="form-input"
              />
            </div>

            {/* Context info */}
            {(reclamationId || interventionId) && (
              <div className="mb-4 p-3 bg-primary-50 rounded-xl text-sm text-primary-700 border border-primary-100">
                Cette conversation sera liée à :
                {reclamationId && <span className="font-semibold"> Réclamation #{reclamationId}</span>}
                {interventionId && <span className="font-semibold"> Intervention #{interventionId}</span>}
              </div>
            )}

            {/* Message */}
            <div className="mb-4">
              <label htmlFor="messageInitial" className="block text-sm font-medium text-slate-700 mb-1.5">
                Votre message
              </label>
              <textarea
                id="messageInitial"
                value={messageInitial}
                onChange={(e) => setMessageInitial(e.target.value)}
                placeholder="Écrivez votre message..."
                rows={4}
                className="form-input resize-none"
                required
              />
            </div>

            {/* Error message */}
            {startConversationMutation.isError && (
              <div className="mb-4 p-3 bg-danger/10 text-danger rounded-xl text-sm border border-danger/20">
                Une erreur est survenue. Veuillez réessayer.
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-700 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!messageInitial.trim() || startConversationMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {startConversationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StartConversationModal;
