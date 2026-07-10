import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const BLACK = rgb(0.1, 0.1, 0.1);
const DARK = rgb(0.2, 0.2, 0.2);
const MUTED = rgb(0.5, 0.5, 0.5);
const GOLD = rgb(0.72, 0.58, 0.25);
const LINE = rgb(0.8, 0.8, 0.8);

export async function generateTicketPDF(billet) {
  const prixPaye = Number(billet.prix_paye) || 0;
  const prixAvant = Number(billet.prix_avant) || 0;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([280, 500]); // Portrait, format billet
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Fine top accent line (économise l'encre)
  page.drawRectangle({
    x: 0, y: 496, width: 280, height: 4,
    color: GOLD,
  });

  // Title
  page.drawText('PRINCE', {
    x: 92, y: 462, size: 24, font: fontBold, color: BLACK,
  });
  page.drawText('11 JUILLET 2026 · 20H30', {
    x: 53, y: 442, size: 9, font: font, color: MUTED,
  });

  // Divider
  page.drawRectangle({
    x: 30, y: 422, width: 220, height: 0.5,
    color: LINE,
  });

  // Ticket number
  page.drawText('BILLET N°', {
    x: 30, y: 397, size: 8, font: font, color: MUTED,
  });
  page.drawText(billet.numero_billet, {
    x: 30, y: 380, size: 13, font: fontBold, color: BLACK,
  });

  // Name
  page.drawText('NOM', {
    x: 30, y: 347, size: 8, font: font, color: MUTED,
  });
  page.drawText(`${billet.prenom} ${billet.nom}`.toUpperCase(), {
    x: 30, y: 330, size: 13, font: fontBold, color: BLACK,
  });

  // Type
  page.drawText('TYPE', {
    x: 30, y: 297, size: 8, font: font, color: MUTED,
  });
  page.drawText(billet.type.toUpperCase(), {
    x: 30, y: 282, size: 11, font: font, color: DARK,
  });

  // Price
  const prixFormate = prixPaye.toFixed(2).replace('.', ',');
  page.drawText('PRIX', {
    x: 150, y: 297, size: 8, font: font, color: MUTED,
  });
  page.drawText(`${prixFormate}€`, {
    x: 150, y: 282, size: 14, font: fontBold, color: BLACK,
  });

  // Promo info
  if (billet.code_promo && prixAvant > prixPaye) {
    const prixAvantFormate = prixAvant.toFixed(2).replace('.', ',');
    page.drawText(`Avant remise: ${prixAvantFormate}€`, {
      x: 150, y: 268, size: 7, font: font, color: MUTED,
    });
    page.drawText(`Code ${billet.code_promo}`, {
      x: 150, y: 257, size: 7, font: font, color: GOLD,
    });
  }

  // Divider
  page.drawRectangle({
    x: 30, y: 257, width: 220, height: 0.5,
    color: LINE,
  });

  // Venue
  page.drawText('LIEU', {
    x: 30, y: 232, size: 8, font: font, color: MUTED,
  });
  page.drawText('Salle polyvalente', {
    x: 30, y: 217, size: 11, font: font, color: DARK,
  });
  page.drawText('Louis Maisonnat', {
    x: 30, y: 202, size: 11, font: font, color: DARK,
  });
  page.drawText('43 Rue du 19 Mars 1962', {
    x: 30, y: 187, size: 9, font: font, color: MUTED,
  });
  page.drawText('38450 Vif', {
    x: 30, y: 174, size: 9, font: font, color: MUTED,
  });

  // Doors info
  page.drawText('OUVERTURE DES PORTES', {
    x: 30, y: 144, size: 8, font: font, color: MUTED,
  });
  page.drawText('19h30', {
    x: 30, y: 129, size: 11, font: font, color: DARK,
  });
  page.drawText('FERMETURE DES PORTES', {
    x: 150, y: 144, size: 8, font: font, color: MUTED,
  });
  page.drawText('20h25', {
    x: 150, y: 129, size: 11, font: font, color: DARK,
  });
  page.drawText('Aucune entrée tardive possible', {
    x: 30, y: 110, size: 8, font: font, color: GOLD,
  });
  page.drawText('Placement libre (non numéroté)', {
    x: 30, y: 96, size: 8, font: font, color: MUTED,
  });

  // Divider
  page.drawRectangle({
    x: 30, y: 90, width: 220, height: 0.5,
    color: LINE,
  });

  // Footer
  page.drawText('Buvette et snack sur place', {
    x: 30, y: 70, size: 8, font: font, color: MUTED,
  });
  page.drawText('au profit de l\'association Histoire 2 Gazelles', {
    x: 30, y: 57, size: 7, font: font, color: MUTED,
  });
  page.drawText('Parking gratuit sur place', {
    x: 30, y: 40, size: 8, font: font, color: MUTED,
  });
  page.drawText('Présentez ce billet à l\'entrée', {
    x: 30, y: 22, size: 8, font: font, color: MUTED,
  });
  page.drawText('(numérique ou papier)', {
    x: 30, y: 10, size: 8, font: font, color: MUTED,
  });

  return pdf.saveAsBase64({ dataUri: false });
}
