import { useState, useCallback, useRef } from 'react';
import { ClientConfig, BookingFormData } from '../../types';
import { createBooking } from '../../api';
import { generateAvailableSlots } from '../../utils/slots';

export type ConversationStep =
  | 'greeting'
  | 'name'
  | 'phone'
  | 'email'
  | 'service'
  | 'address'
  | 'slot'
  | 'confirm'
  | 'booked'
  | 'error';

export interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  options?: string[];
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function validateField(step: ConversationStep, value: string): string | null {
  switch (step) {
    case 'name':
    case 'address':
      return value.trim().length < 2
        ? 'Please enter a valid response (at least 2 characters).'
        : null;
    case 'phone':
      return /^[\d\s\-.()+ ]{7,20}$/.test(value.trim())
        ? null
        : "That doesn't look like a valid phone number. Try something like 555-123-4567.";
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        ? null
        : "That doesn't look like a valid email. Could you double-check it?";
    default:
      return null;
  }
}

// Service-aware address prompt so the bot acknowledges what the customer needs
const ADDRESS_PROMPTS: Record<string, string> = {
  'Roof Inspection':
    "Our inspector will do a full top-to-bottom assessment. What's the property address?",
  'Roof Repair':
    "Our repair crew will get that taken care of. What's the property address?",
  'Full Roof Replacement':
    "That's a big project — we'll make sure it's done right. What's the property address?",
  'Gutter Cleaning & Repair':
    "Our team will have those gutters flowing again. What's the property address?",
  'Emergency Tarping':
    "Understood — we treat these as priority. What's the property address so we can get someone out fast?",
};

export function useConversation(config: ClientConfig) {
  const availableSlots = useRef(generateAvailableSlots()).current;

  const stepRef = useRef<ConversationStep>('greeting');
  const [step, setStep] = useState<ConversationStep>('greeting');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const formDataRef = useRef<Partial<BookingFormData>>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'bot',
      text: config.welcomeMessage,
      options: ['Yes, let\'s do it!'],
    },
  ]);

  // addBot shows a typing indicator for `delay` ms, then reveals the message.
  // Longer messages or those with options get a slightly longer pause.
  const addBot = useCallback((text: string, options?: string[]) => {
    const delay = options ? 900 : 700;
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: uid(), role: 'bot', text, options }]);
    }, delay);
  }, []);

  const addUser = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: 'user', text }]);
  }, []);

  const advance = useCallback((nextStep: ConversationStep) => {
    stepRef.current = nextStep;
    setStep(nextStep);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const currentStep = stepRef.current;
      if (currentStep === 'booked' || currentStep === 'error') return;

      const validationError = validateField(currentStep, text);
      if (validationError) {
        addUser(text);
        addBot(validationError);
        return;
      }

      addUser(text);
      const data = formDataRef.current;

      switch (currentStep) {
        case 'greeting':
          advance('name');
          addBot(`Great! This'll just take a moment. First — what's your name?`);
          break;

        case 'name':
          formDataRef.current = { ...data, name: text.trim() };
          advance('phone');
          addBot(
            `Nice to meet you, ${text.trim()}! What's the best phone number to reach you? We'll use it to confirm your appointment.`
          );
          break;

        case 'phone':
          formDataRef.current = { ...data, phone: text.trim() };
          advance('email');
          addBot(`Perfect. And your email address? We'll send a booking confirmation there.`);
          break;

        case 'email':
          formDataRef.current = { ...data, email: text.trim() };
          advance('service');
          addBot(`What can we help you with today? Choose a service below:`, config.services);
          break;

        case 'service':
          if (!config.services.includes(text)) {
            addBot(`Please select one of the services listed below.`, config.services);
            break;
          }
          formDataRef.current = { ...data, service: text };
          advance('address');
          addBot(ADDRESS_PROMPTS[text] ?? `What's the property address for the ${text.toLowerCase()}?`);
          break;

        case 'address':
          formDataRef.current = { ...data, address: text.trim() };
          advance('slot');
          addBot(
            `Here are our next available openings. Which time works best for you?`,
            availableSlots
          );
          break;

        case 'slot':
          if (!availableSlots.includes(text)) {
            addBot(`Please choose one of the available time slots below.`, availableSlots);
            break;
          }
          formDataRef.current = { ...data, slot: text };
          advance('confirm');
          {
            const d = formDataRef.current;
            const summary = [
              `Here's your appointment summary — please review before confirming:`,
              ``,
              `  Service    ${d.service}`,
              `  Address    ${d.address}`,
              `  Date/Time  ${text}`,
              ``,
              `  Name       ${d.name}`,
              `  Phone      ${d.phone}`,
              `  Email      ${d.email}`,
              ``,
              `Everything look right? Tap "Confirm Appointment" to lock in your spot.`,
            ].join('\n');
            addBot(summary, ['Confirm Appointment', 'No, start over']);
          }
          break;

        case 'confirm':
          if (text === 'No, start over' || text.toLowerCase().startsWith('no')) {
            formDataRef.current = {};
            advance('greeting');
            addBot(config.welcomeMessage, ["Yes, let's do it!"]);
            break;
          }
          {
            const d = formDataRef.current as BookingFormData;
            setIsLoading(true);
            createBooking({
              client_id: config.id,
              name: d.name,
              phone: d.phone,
              email: d.email,
              service: d.service,
              address: d.address,
              slot: d.slot,
            })
              .then(() => {
                advance('booked');
                addBot(
                  `You're all set, ${d.name}! Your ${d.service} appointment is confirmed for ${d.slot}.\n\nA ${config.name} team member will call you at ${d.phone} within 24 hours to confirm. We look forward to working with you!`
                );
              })
              .catch(() => {
                advance('error');
                addBot(
                  `Hmm, something went wrong on our end — your appointment wasn't saved. Please call us directly or try again in a moment.`
                );
              })
              .finally(() => setIsLoading(false));
          }
          break;
      }
    },
    [addBot, addUser, advance, config, availableSlots]
  );

  return { messages, step, isLoading, isTyping, sendMessage };
}
