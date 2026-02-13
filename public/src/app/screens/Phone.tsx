import { useState } from 'react';
import { TopHeader } from '../components/TopHeader';
import { mockContacts } from '../data/mock-data';
import { MessageSquare, ChevronRight } from 'lucide-react';

export function Phone() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  if (selectedContact) {
    const contact = mockContacts.find((c) => c.id === selectedContact);
    return (
      <div 
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <TopHeader title={contact?.name || 'Conversation'} />

        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
          {/* Message from contact */}
          <div className="flex justify-start">
            <div 
              className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <p className="text-sm text-white">
                We need to discuss the Marcus Jackson contract extension. His agent is pushing for $45M/year.
              </p>
            </div>
          </div>

          {/* Response options */}
          <div className="flex justify-end">
            <div 
              className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <p className="text-sm text-white">
                That's too high. Counter with $38M and more guarantees.
              </p>
            </div>
          </div>

          <div className="flex justify-start">
            <div 
              className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <p className="text-sm text-white">
                Understood. I'll negotiate and get back to you by end of day.
              </p>
            </div>
          </div>
        </div>

        {/* Choice Buttons */}
        <div className="p-4 flex flex-col gap-2">
          <button
            className="py-3 px-4 rounded-xl text-sm font-medium text-left transition-all"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <span className="text-white">Approve the negotiation strategy</span>
          </button>
          <button
            className="py-3 px-4 rounded-xl text-sm font-medium text-left transition-all"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <span className="text-white">Request more cap space analysis</span>
          </button>
          <button
            onClick={() => setSelectedContact(null)}
            className="py-3 px-4 rounded-xl text-sm font-medium text-center transition-all"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <span className="text-white/60">Back to Contacts</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: '#000000' }}
    >
      <TopHeader title="Messages" showBack={true} />

      <div className="flex flex-col gap-2 p-4">
        {mockContacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => setSelectedContact(contact.id)}
            className="flex items-center gap-4 p-4 rounded-xl transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <MessageSquare className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-white">{contact.name}</div>
              <div className="text-xs text-white/60">{contact.role}</div>
            </div>
            <div className="flex items-center gap-2">
              {contact.unread > 0 && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {contact.unread}
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-white/40" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
