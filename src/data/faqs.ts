import { business } from './business';
export const faqs = [
  { q: 'Where is Gulshan Banquet Hall located?', a: `We are on ${business.address.full}. Use the Get Directions button in the Contact section to open the route in Google Maps.` },
  { q: 'How can I book an event?', a: `Use the enquiry planner on this page or call us on ${business.phone.display}. Our team will confirm availability and next steps; submitting an enquiry does not reserve a date by itself.` },
  { q: 'What types of events can be arranged?', a: 'We receive enquiries for weddings (mehndi, baraat, walima, nikkah), engagements, birthdays, family gatherings and corporate events. Please confirm your specific requirements with our team.' },
  { q: 'Can I request customized decoration?', a: 'Yes, you can describe your ideas in the enquiry. Our team will confirm what decoration arrangements are possible for your date.' },
  { q: 'Are catering services available?', a: 'Select Catering in the enquiry planner and our team will confirm the menu and dining arrangements available with you.' },
  { q: 'How can I check available dates?', a: `Choose your preferred date in the planner and send the enquiry, or call ${business.phone.display}. Availability is always confirmed by management.` },
  { q: 'How can I get package details?', a: 'Official package details are shared directly by management. Choose "Request a Quote" in the planner and we will get back to you.' },
];
