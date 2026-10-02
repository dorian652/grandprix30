# Grand Prix de nos 30 ans

Site d'invitation aux 30 ans de Lucie et Lilian (samedi 20 mars 2027, 19h30, La Palette Verte, Écaussinnes).
Publié avec GitHub Pages sur https://grandprix30ans.be/ (adresse de secours : https://dorian652.github.io/grandprix30/)

## Contenu

- `index.html` : la page complète (billet, procédure de départ, chrono, programme, grille des écuries, radio, circuit, drapeaux). Aucune dépendance en dehors des polices Google.
- `og.jpg` : image d'aperçu pour WhatsApp, Messenger et Facebook.
- `icon-*.png`, `apple-touch-icon.png`, `manifest.webmanifest` : icône et installation sur l'écran d'accueil.
- `galerie.html` : le paddock photo, page à part où les invités déposent leurs photos (réduites à 1 600 px côté téléphone) ; elles vont dans le dossier Drive « GP 30 ans - Photos » et s'affichent pour tous.
- `apps-script/Code.gs` : script Google Apps Script qui enregistre les engagements par écurie, les chronos du concours de pit stop et les photos dans une feuille Google Sheets (onglets « Engagements », « PitStop », « Photos »).

## Activer les inscriptions par écurie

Les invités (plus de 100) choisissent chacun l'écurie pour laquelle ils roulent. Pour que ces choix soient enregistrés et visibles par tous, le site a besoin d'une feuille Google Sheets reliée par un petit script.

1. Créer une feuille Google Sheets vide.
2. Extensions > Apps Script, coller le contenu de `apps-script/Code.gs`, enregistrer.
3. Déployer > Nouveau déploiement > Application Web, « Exécuter en tant que : Moi », « Qui a accès : Tout le monde », Déployer, puis autoriser.
4. Copier l'URL de l'application Web (terminée par `/exec`) et la coller dans `index.html`, constante `API_URL`.

Tant que `API_URL` est vide, la grille et le classement du pit stop fonctionnent en mode essai : les données restent sur l'appareil du visiteur.

## Règles de la grille

- 11 écuries, 30 pilotes maximum par écurie.
- Une inscription = un pilote, identifié par son prénom et son nom ; chacun s'inscrit lui-même.
- Pour modifier : retaper son nom, choisir une autre écurie, valider (depuis n'importe quel appareil). « Me retirer de la grille » supprime l'inscription.
- Mode organisateur : ajouter `#admin` à l'adresse du site, saisir le code `ADMIN_PIN` défini dans le script ; une croix apparaît sur chaque inscription et chaque chrono pour les retirer.
- La feuille Google Sheets reste la référence : supprimer une ligne retire l'engagement du site.
