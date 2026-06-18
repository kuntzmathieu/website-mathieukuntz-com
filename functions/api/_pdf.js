import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const BG = rgb(0.039, 0.039, 0.078);
const GOLD = rgb(0.91, 0.78, 0.42);
const WHITE = rgb(0.949, 0.937, 0.918);
const MUTED = rgb(0.5, 0.5, 0.6);

export async function generateTicketPDF(billet) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([280, 500]); // Portrait, format billet
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Background
  page.drawRectangle({
    x: 0, y: 0, width: 280, height: 500,
    color: BG,
  });

  // Gold accent line top
  page.drawRectangle({
    x: 0, y: 494, width: 280, height: 6,
    color: GOLD,
  });

  // Title
  page.drawText('PRINCE', {
    x: 85, y: 460, size: 24, font: fontBold, color: GOLD,
  });
  page.drawText('11 JUILLET 2026 · 20H', {
    x: 50, y: 440, size: 9, font: font, color: MUTED,
  });

  // Divider
  page.drawRectangle({
    x: 30, y: 420, width: 220, height: 1,
    color: rgb(0.2, 0.2, 0.3),
  });

  // Ticket number
  page.drawText('BILLET N°', {
    x: 30, y: 395, size: 8, font: font, color: MUTED,
  });
  page.drawText(billet.numero_billet, {
    x: 30, y: 378, size: 13, font: fontBold, color: WHITE,
  });

  // Name
  page.drawText('NOM', {
    x: 30, y: 345, size: 8, font: font, color: MUTED,
  });
  page.drawText(`${billet.prenom} ${billet.nom}`.toUpperCase(), {
    x: 30, y: 328, size: 13, font: fontBold, color: WHITE,
  });

  // Type
  page.drawText('TYPE', {
    x: 30, y: 295, size: 8, font: font, color: MUTED,
  });
  page.drawText(billet.type.toUpperCase(), {
    x: 30, y: 280, size: 11, font: font, color: WHITE,
  });

  // Price
  page.drawText('PRIX', {
    x: 150, y: 295, size: 8, font: font, color: MUTED,
  });
  page.drawText(`${billet.prix_paye}€`, {
    x: 150, y: 280, size: 14, font: fontBold, color: GOLD,
  });

  // Divider
  page.drawRectangle({
    x: 30, y: 255, width: 220, height: 1,
    color: rgb(0.2, 0.2, 0.3),
  });

  // Venue
  page.drawText('LIEU', {
    x: 30, y: 230, size: 8, font: font, color: MUTED,
  });
  page.drawText('Salle polyvalente', {
    x: 30, y: 215, size: 11, font: font, color: WHITE,
  });
  page.drawText('Louis Maisonat', {
    x: 30, y: 200, size: 11, font: font, color: WHITE,
  });
  page.drawText('43 Rue du 19 Mars 1962', {
    x: 30, y: 185, size: 9, font: font, color: MUTED,
  });
  page.drawText('38450 Vif', {
    x: 30, y: 172, size: 9, font: font, color: MUTED,
  });

  // Doors info
  page.drawText('OUVERTURE DES PORTES', {
    x: 30, y: 142, size: 8, font: font, color: MUTED,
  });
  page.drawText('19h30', {
    x: 30, y: 127, size: 11, font: font, color: WHITE,
  });
  page.drawText('FERMETURE DES PORTES', {
    x: 150, y: 142, size: 8, font: font, color: MUTED,
  });
  page.drawText('19h55', {
    x: 150, y: 127, size: 11, font: font, color: WHITE,
  });
  page.drawText('Aucune entrée tardive possible', {
    x: 30, y: 108, size: 8, font: font, color: GOLD,
  });

  // Divider
  page.drawRectangle({
    x: 30, y: 88, width: 220, height: 1,
    color: rgb(0.2, 0.2, 0.3),
  });

  // Footer
  page.drawText('Buvette et snack sur place', {
    x: 30, y: 68, size: 8, font: font, color: MUTED,
  });
  page.drawText('au profit de l\'association XXX', {
    x: 30, y: 55, size: 8, font: font, color: MUTED,
  });
  page.drawText('Parking gratuit sur place', {
    x: 30, y: 38, size: 8, font: font, color: MUTED,
  });
  page.drawText('Présentez ce billet à l\'entrée', {
    x: 30, y: 20, size: 8, font: font, color: MUTED,
  });

  return pdf.saveAsBase64({ dataUri: false });
}
