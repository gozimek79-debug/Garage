import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  nl: {
    translation: {
      "nav.dashboard": "Overzicht",
      "nav.calendar": "Planning",
      "nav.bookings": "Werkplaatsagenda",
      "nav.workOrders": "Werkorders",
      "nav.customers": "Klanten & voertuigen",
      "nav.servicePassport": "Servicepaspoort",
      "nav.myGarage": "Mijn garage",
      "nav.inventory": "Magazijn",
      "nav.invoices": "Facturen",
      "nav.occasions": "Occasions",
      "nav.shop": "Onderdelenwinkel",
      "nav.integrations": "Koppelingen",
      "nav.demoGuide": "Demo rondleiding",
      "app.brand.title": "SST GARAGE",
      "app.brand.subtitle": "WERKPLAATS PLATFORM",
      "app.language_switcher": "Kies taal",
      "dashboard.title": "Goedemorgen, werkplaats.",
      "dashboard.subtitle": "De dag in beeld. Van binnenkomst tot sleuteloverdracht.",
      "dashboard.eyebrow": "Dinsdag · werkplaats",
      "dashboard.newBooking": "Afspraak inplannen",
      "shell.menuClose": "Menu sluiten",
      "shell.menuOpen": "Navigatiemenu",
      "shell.demoRole": "Demo rol",
      "shell.resetDemo": "Herstel demo-data",
      "shell.signOut": "Uitloggen",
      "shell.notifications": "Meldingen",
      "shell.notificationsClose": "Meldingen sluiten",
      "shell.notificationsEmpty": "Geen nieuwe meldingen."
    }
  },
  en: {
    translation: {
      "nav.dashboard": "Dashboard",
      "nav.calendar": "Calendar",
      "nav.bookings": "Workshop schedule",
      "nav.workOrders": "Work orders",
      "nav.customers": "Customers & vehicles",
      "nav.servicePassport": "Service passport",
      "nav.myGarage": "My garage",
      "nav.inventory": "Inventory",
      "nav.invoices": "Invoices",
      "nav.occasions": "Used cars",
      "nav.shop": "Parts shop",
      "nav.integrations": "Integrations",
      "nav.demoGuide": "Demo guide",
      "app.brand.title": "SST GARAGE",
      "app.brand.subtitle": "WORKSHOP PLATFORM",
      "app.language_switcher": "Select language",
      "dashboard.title": "Good morning, workshop.",
      "dashboard.subtitle": "The day at a glance. From check-in to key handover.",
      "dashboard.eyebrow": "Tuesday · workshop",
      "dashboard.newBooking": "Schedule appointment",
      "shell.menuClose": "Close menu",
      "shell.menuOpen": "Navigation menu",
      "shell.demoRole": "Demo role",
      "shell.resetDemo": "Reset demo data",
      "shell.signOut": "Sign out",
      "shell.notifications": "Notifications",
      "shell.notificationsClose": "Close notifications",
      "shell.notificationsEmpty": "No new notifications."
    }
  },
  pl: {
    translation: {
      "nav.dashboard": "Pulpit",
      "nav.calendar": "Kalendarz",
      "nav.bookings": "Terminarz warsztatu",
      "nav.workOrders": "Zlecenia pracy",
      "nav.customers": "Klienci i pojazdy",
      "nav.servicePassport": "Paszport serwisowy",
      "nav.myGarage": "Mój warsztat",
      "nav.inventory": "Magazyn",
      "nav.invoices": "Faktury",
      "nav.occasions": "Samochody używane",
      "nav.shop": "Sklep z częściami",
      "nav.integrations": "Integracje",
      "nav.demoGuide": "Przewodnik po wersji demo",
      "app.brand.title": "SST GARAGE",
      "app.brand.subtitle": "PLATFORMA WARSZTATOWA",
      "app.language_switcher": "Wybierz język",
      "dashboard.title": "Dzień dobry, warsztacie.",
      "dashboard.subtitle": "Dzień w skrócie. Od przyjęcia do wydania kluczyków.",
      "dashboard.eyebrow": "Wtorek · warsztat",
      "dashboard.newBooking": "Zaplanuj wizytę",
      "shell.menuClose": "Zamknij menu",
      "shell.menuOpen": "Menu nawigacji",
      "shell.demoRole": "Rola demo",
      "shell.resetDemo": "Zresetuj dane demo",
      "shell.signOut": "Wyloguj",
      "shell.notifications": "Powiadomienia",
      "shell.notificationsClose": "Zamknij powiadomienia",
      "shell.notificationsEmpty": "Brak nowych powiadomień."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "nl", // default language
    fallbackLng: "nl",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
