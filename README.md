# Grand Prix de nos 30 ans

Site d'invitation aux 30 ans de Lucie et Lilian (samedi 20 mars 2027, 19h30, La Palette Verte, Écaussinnes).
Publié avec GitHub Pages : https://dorian652.github.io/grandprix30/

## Contenu

- `index.html` : la page complète (billet, procédure de départ, chrono, programme, grille des écuries, radio, circuit, drapeaux). Aucune dépendance en dehors des polices Google.
- `og.jpg` : image d'aperçu pour WhatsApp, Messenger et Facebook.
- `icon-*.png`, `apple-touch-icon.png`, `manifest.webmanifest` : icône et installation sur l'écran d'accueil.
- `apps-script/Code.gs` : script Google Apps Script qui enregistre les engagements dans une feuille Google Sheets.

## Activer les inscriptions par écurie

Les invités (plus de 100) choisissent l'écurie pour laquelle ils roulent, seuls ou en duo. Pour que ces choix soient enregistrés et visibles par tous, le site a besoin d'une feuille Google Sheets reliée par un petit script.

1. Créer une feuille Google Sheets vide.
2. Extensions > Apps Script, coller le contenu de `apps-script/Code.gs`, enregistrer.
3. Déployer > Nouveau déploiement > Application Web, « Exécuter en tant que : Moi », « Qui a accès : Tout le monde », Déployer, puis autoriser.
4. Copier l'URL de l'application Web (terminée par `/exec`) et la coller dans `index.html`, constante `API_URL`.

Tant que `API_URL` est vide, la grille s'affiche en lecture seule.

## Règles de la grille

- 11 écuries, 30 pilotes maximum par écurie.
- Une inscription couvre une personne ou un duo.
- Chaque visiteur peut modifier ou retirer son propre engagement depuis le même navigateur.
- La feuille Google Sheets reste la référence : supprimer une ligne retire l'engagement du site.
