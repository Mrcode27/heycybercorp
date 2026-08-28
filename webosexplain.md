# heycybercorp — le webOS et les cas pratiques

> **Ce document décrit ce qui existe.** Le moteur est construit et déployé,
> avec quatre cas publiés dont un cas Avancé réservé au pack Piratage Éthique.
> Ce qui reste à faire est isolé au §11.
>
> Dernière mise à jour : août 2026.

---

## 1. Ce que c'est

Le **webOS** est un poste de travail Linux simulé qui démarre, ouvre une
session et remet un bureau à l'étudiant. Le **cas** est le dossier qu'il y
traite : une situation, des pièces, des questions.

Rien n'est émulé. Ni noyau, ni machine virtuelle, ni image WebAssembly à
télécharger. C'est du React, du CSS et un shell maison — donc **zéro coût
serveur par étudiant**, et rien qui puisse « casser » puisqu'il n'y a rien à
imiter fidèlement.

Ce que cela achète est le cadrage : un analyste ne rencontre pas un incident
sous la forme d'un champ de saisie sur une page web. Il le rencontre sur une
machine.

| | Émulateur d'OS (v86, WebVM) | Ce que nous faisons |
|---|---|---|
| Ce qu'on écrit | des commandes | des situations |
| Ce qui casse l'illusion | `command not found` | rien à émuler |
| Poids au premier chargement | 20 à 100 Mo | quelques Ko |
| Coût serveur par étudiant | élevé | **nul** |
| Ce qu'on enseigne | une syntaxe | **le jugement** |

---

## 2. L'expérience, écran par écran

```
Carte de lancement  →  Manuel  →  Démarrage  →  Écran de session  →  Bureau
   (dans le cas)      (obligatoire)  (log noyau)   (façon GDM)      (plein écran)
```

**Carte de lancement.** Le nom de la machine, l'utilisateur, le nombre de
fichiers, un bouton « Lire le manuel et démarrer ».

**Manuel.** Avant chaque lancement WebOS, trois cartes expliquent le Dossier,
le Terminal, le gestionnaire de fichiers, le double-clic, le clic droit et la
sortie par `Échap`. Il reste réouvrable depuis le menu contextuel du bureau.

**Démarrage.** Un vrai log systemd : version du noyau, mémoire, initrd, puis
des lignes `[  OK  ]` pour journald, NetworkManager, sshd, le collecteur SIEM,
la sonde IDS. Ces lignes sont reconnaissables par un praticien — c'est
exactement l'effet recherché. Un lien discret permet de passer.

**Écran de session.** Horloge, date, avatar, `analyste@srv-app`. Entrée ou clic.

**Bureau.** Interface GNOME, pas Windows :

| Élément | Comportement |
|---|---|
| Barre supérieure | Activités · horloge centrée · réseau, son, batterie, extinction |
| Dash (gauche) | Lanceurs avec témoin d'application ouverte |
| Icônes du bureau | Les fichiers du cas, double-clic pour ouvrir |
| Clic droit sur le bureau | Ouvrir Dossier, Terminal, Fichiers, Télémétrie, manuel ou sortie |
| Clic droit sur une pièce | Ouvrir, afficher dans Fichiers ou copier son nom |
| Fenêtres | Barre de titre GNOME (titre centré, boutons à droite), déplaçables, réduire / agrandir / fermer |
| Vue Activités | Toutes les fenêtres ouvertes, clic pour revenir |
| Bac inférieur | Fenêtres réduites |
| Sortie | `Échap` ouvre l'écran de sortie ; la progression validée est conservée |

**Applications :** Terminal, Fichiers, Lecteur de texte, Moniteur système et
**Dossier** — l'application qui porte les questions du cas, pour répondre sans
quitter le bureau. Toutes partagent **un seul système de fichiers en mémoire** —
un fichier écrit dans le terminal apparaît dans le gestionnaire de fichiers.

**Le dossier vit dans la machine**, sous la forme de `question.txt`, ouvert à
la connexion et accessible depuis le bureau, Fichiers ou `cat question.txt`.
L'énoncé ne disparaît jamais de l'écran.

---

## 3. Public : la francophonie, sans localisme

Le contenu s'adresse à **tout l'espace francophone** — France, Belgique,
Suisse, Québec, Cameroun, Sénégal, Côte d'Ivoire, RDC, Maroc, Tunisie. Un
étudiant à Douala et un étudiant à Lyon doivent se reconnaître dans le même cas.

### Entités fictives, mécanismes réels

Aucun cas ne cite une marque, une administration ou une banque réelle :

| Rôle | Entité fictive |
|---|---|
| Transporteur | RapidColis |
| Banque | Banque Méridienne |
| Opérateur / paiement mobile | Talia Mobile |
| Assurance santé | AssurLibre |
| Employeur | Groupe Sévigné |
| Réseau social | Voltis |

Trois raisons :

1. **Neutralité géographique.** Citer une administration nationale exclut
   d'emblée les trois quarts du public.
2. **Responsabilité.** Un phishing rédigé autour d'une vraie marque *est* un
   modèle prêt à l'emploi contre elle. On enseigne le mécanisme, on ne livre
   pas l'outil.
3. **Durabilité.** Une interface réelle change ; le mécanisme, non.

### Le droit, enseigné en comparatif

| Espace | Texte | Délai de notification |
|---|---|---|
| Union européenne | RGPD | 72 h |
| Suisse | nLPD | « meilleurs délais » |
| Québec | Loi 25 | « avec diligence » |
| Union africaine | Convention de Malabo | transposition nationale |

Plus utile qu'un cours mono-pays, et invisible chez les plateformes anglophones.

---

## 4. Poste fixe uniquement

Jouer un cas exige un ordinateur. Sur petit écran on affiche une invitation à
revenir, pas une version dégradée.

C'est le choix de **toutes** les plateformes comparables — TryHackMe
(AttackBox), Hack The Box (Pwnbox), CompTIA (CertMaster Labs), Coursera.
Aucune ne propose ses environnements pratiques sur téléphone.

Trois garde-fous, tous en place :

1. **Seuls les cas sont concernés.** Vitrine, catalogue, tarifs, paiement et
   lecture des cours restent pleinement mobiles.
2. **Le catalogue reste consultable** sur téléphone : on voit ce qu'on achète.
3. **Le refus est utile** : voir le catalogue, revenir aux formations, ou
   « Continuer quand même » — une tablette en paysage avec clavier s'en sort.

Détection : largeur < 1024 px **et** pointeur grossier. Jamais le `User-Agent`,
qui ment et se contrefait.
→ `src/components/DesktopOnlyGate.tsx`

---

## 5. Anatomie d'un cas

```
CAS
├── Mise en situation   « 03h14. Le SIEM vous réveille. »
├── Pièces              1 à n artefacts (§6)
├── Étapes 3 à 6        question · vérification serveur · indice · conséquence
└── Verdict             UNE décision finale
```

Règles de conception :

- **Une seule décision finale.** Le reste instruit le dossier.
- **Les mauvaises réponses doivent être plausibles.** Un phishing évident
  n'enseigne rien.
- **La conséquence est révélée après coup** — c'est là qu'est la leçon, pas
  dans la bonne réponse.
- **3 à 6 étapes.** Au-delà, c'est un devoir maison.
- **Pression temporelle dans le récit, jamais de minuteur réel.**
- **Crédit partiel** : chaque étape validée compte.

---

## 6. Les huit types de pièces

| Type | Rendu |
|---|---|
| `webos` | Le poste complet : démarrage, session, bureau |
| `terminal` | Un shell seul, sans bureau |
| `email` | Client mail, en-têtes techniques dépliables |
| `log` | Visionneuse filtrable, ligne à ligne |
| `file` | Arborescence + aperçu |
| `table` | Tableau triable |
| `http` | Requête / réponse brutes |
| `image` | Capture (même origine ou `data:` — la CSP bloque les hôtes tiers) |

### Le shell

19 commandes de base (`ls`, `cat`, `grep`, `wc`, `head`, `tail`, `tree`,
`ping`, `nmap`, `netstat`, `ifconfig`, `traceroute`, `hashid`, `sudo`…),
plus 8 verbes propres à la page d'accueil.

Chaque cas déclare **son** système de fichiers et **sa** liste blanche de
commandes. `help` liste exactement ce qui existe : contrat explicite, rien de
caché. Une commande hors périmètre répond « non disponible dans ce
laboratoire » — jamais `command not found`, qui ferait croire à un défaut.

→ `src/lib/shell/index.ts` · `src/components/shell/Terminal.tsx`

---

## 7. La correction des réponses

**On ne note pas l'orthographe.** Un étudiant qui a compris le cas ne doit pas
échouer sur un synonyme ou une virgule. Chaque étape choisit son mode :

| Mode | Comportement | À utiliser pour |
|---|---|---|
| `exact` | Égalité normalisée, **tolère une faute par ~8 caractères** | une valeur précise |
| `contains` | La valeur attendue apparaît dans la réponse | IP, adresse, identifiant |
| `keywords` | Chaque mot ou racine listé est présent, dans n'importe quel ordre | une phrase, une idée |

La normalisation supprime accents, ponctuation et espaces multiples. Ainsi,
sur une étape `keywords` demandant `partag` + `personne` :

- « ne le partagez avec personne » ✅
- « il ne faut pas partager le code avec personne » ✅
- « Ne le partagez, avec personne ! » ✅
- « envoyer le code » ❌

La rigueur reste là où elle a un sens : une IP ou un horodatage ne gagne rien à
être presque juste. `contains` ne vérifie qu'un sens — accepter aussi
« l'attendu contient la réponse » laisserait passer `45.146.83.1` pour
`45.146.83.12`.

Chaque étape accepte en plus une liste de **formulations alternatives**, saisie
depuis l'admin.

→ `matches()` dans `convex/cases.ts`

---

## 8. Les quatre tiers

**Le tier se mesure à la profondeur, pas au nombre.** « Vous en avez 3 au lieu
d'1 » donne le sentiment d'être rationné ; « vous avez les investigations
complètes » se vend seul.

Cible : **Gratuit 2 · Débutant 6 · Intermédiaire 7 · Avancé 7**.
Quatre sont écrits (marqués ✅).

### Gratuit — la vitrine
Aucun terminal, moins de trois minutes, doit produire un déclic.

| Cas | Compétence | |
|---|---|---|
| **Le code à 6 chiffres** | Détournement de compte par code transféré | ✅ |
| « Votre colis est en attente » | SMS : vrai expéditeur, vraie destination du lien | |

### Tier 1 · Débutant — reconnaître

| Cas | Compétence | Terminal | |
|---|---|---|---|
| **La fraude au président** | Pression hiérarchique, vérification hors canal | non | ✅ |
| Le domaine qui n'est pas le bon | Typosquat, homoglyphes | non | |
| Le mot de passe réutilisé | Rayon d'impact d'une fuite | non | |
| L'arnaque au virement instantané | Irréversibilité — mobile ou bancaire | non | |
| Le Wi-Fi ouvert | Faux point d'accès jumeau | non | |
| Première session terminal | Prise en main | **oui** | |

*L'arnaque au virement instantané* est le cas-pont : paiement mobile en
Afrique, virement instantané en Europe, **même mécanisme**.

### Tier 2 · Intermédiaire — analyser

| Cas | Compétence | Terminal | |
|---|---|---|---|
| **03h14 : connexion réussie** | Force brute SSH, confinement | **webOS** | ✅ |
| Le serveur qui parle trop | En-têtes + scan, priorisation | oui | |
| Le processus fantôme | Balise et port de commande | oui | |
| OSINT : le prestataire | Empreinte publique, métadonnées | non | |
| Le certificat qui ne colle pas | Lire une chaîne TLS | non | |
| Le `.env` dans le dépôt | Secret commité, et pourquoi le supprimer ne suffit pas | oui | |
| Trois alertes, dix minutes | Triage : classer et justifier | non | |

### Tier 3 · Avancé — investigations complètes

| Cas | Compétence |
|---|---|
| Compromission d'un compte Voltis | Phishing → cookie de session → reset 2FA → email de récupération |
| Handshake capturé | WPA2, faiblesse d'une PSK |
| Chronologie d'une intrusion | Vecteur initial, temps de présence |
| Le ransomware du vendredi soir | Payer / restaurer / négocier — **et notifier qui, sous quel délai** |
| **02h37 : exfiltration lente** | Tunnel DNS, entropie | ✅ |
| L'insider | Malveillance ou coïncidence ? |
| Le rapport à la direction | Synthèse pour un comité non technique |

Deux méritent une note :

- **L'insider** doit pouvoir se gagner en concluant *« les preuves ne suffisent
  pas à accuser »*. Enseigner la retenue est rare, et c'est ce qui sépare un
  professionnel d'un danger public.
- **Le rapport à la direction** enseigne la compétence qui décide des
  promotions. Presque aucune plateforme ne la couvre.

---

## 9. Où vit le code

### Backend — Convex

| Fichier | Rôle | Lignes |
|---|---|---|
| `convex/cases.ts` | Catalogue, lecture d'un cas, correction, CRUD admin | 485 |
| `convex/schema.ts` | `cases`, `caseArtifacts`, `caseSteps`, `caseStepAttempts` | — |
| `convex/labs.ts` | Challenges à flag unique (cohabitent avec les cas) | 251 |
| `convex/entitlements.ts` | `ownedLevels()` — le verrouillage par pack |
| `convex/users.ts` | `getCurrentUser()`, `requireAdmin()` |
| `convex/lib/audit.ts` | `logAudit()` sur chaque écriture admin |

### Frontend — étudiant

| Fichier | Rôle | Lignes |
|---|---|---|
| `src/components/console/WebOS.tsx` | Manuel, démarrage, session, bureau, fenêtres, menus et applications | 758 |
| `src/components/console/DossierApp.tsx` | Dossier étudiant + coach raisonné et validation locale du test admin | 251 |
| `src/components/console/CaseRunner.tsx` | Enchaînement pièces → étapes | 327 |
| `src/components/console/CaseArtifact.tsx` | Les huit visionneuses | 359 |
| `src/components/console/CasesCatalogue.tsx` | Le catalogue (reste mobile) | 207 |
| `src/components/DesktopOnlyGate.tsx` | La barrière du §4 | 88 |
| `src/lib/shell/index.ts` | Le shell : registre, exécution, complétion | 425 |
| `src/components/shell/Terminal.tsx` | Rendu du terminal | 154 |
| `src/app/dashboard/labs/page.tsx` | Catalogue | — |
| `src/app/dashboard/labs/[slug]/page.tsx` | Un cas | 21 |

### Frontend — admin

| Fichier | Rôle | Lignes |
|---|---|---|
| `src/components/console/AdminLabsWorkspace.tsx` | Session admin, onglets Pratiques / Challenges | 80 |
| `src/components/console/AdminCases.tsx` | Liste principale + éditeur modal des cas | 718 |
| `src/components/console/AdminLabs.tsx` | Liste principale + éditeur modal des challenges | 395 |
| `src/components/console/AdminLabTester.tsx` | Tests isolés, mode réaliste et manuel d’investigation guidé | 274 |
| `src/lib/adminLabTutorial.ts` | Playbooks pédagogiques : problème, hypothèses, commandes, observations et transfert | 425 |
| `src/components/console/AdminModal.tsx` | Cadre modal accessible des éditeurs et tests | 50 |
| `src/app/admin/labs/page.tsx` | Point d'entrée du centre de labs | 25 |
| `convex/caseSeeds.ts` | Migration admin idempotente du premier cas Avancé webOS | — |

Le mode guidé n’est pas une feuille de réponses. Il commence par cadrer le
problème et les enjeux, installe un modèle mental d’analyste, puis déroule chaque
objectif selon le cycle **hypothèse → action → commande → observation → preuve →
réflexe réutilisable**. Les réponses restent repliées derrière une vérification
finale. Pour les cas WebOS, le même coaching apparaît aussi dans l’application
Dossier, à côté du Terminal où les commandes peuvent être reproduites.

`src/proxy.ts` protège déjà `/dashboard(.*)` : rien à y changer.

---

## 10. Sécurité — ce qui est en place

### 10.1 Les réponses ne quittent jamais le serveur
Les charges utiles destinées à l'étudiant sont **construites champ par champ**,
jamais par étalement du document : ajouter une colonne au schéma ne peut donc
pas provoquer de fuite. Un cas verrouillé renvoie `setting: null`, sans pièces
ni étapes — le corps n'est pas envoyé puis masqué.
Le champ optionnel `guide` et les réponses du mode tutoriel ne transitent que
par les requêtes protégées par `requireAdmin()` ; les requêtes étudiantes les
omettent explicitement.
**Vérifié sur la fonction déployée :** zéro occurrence de `answer`, `accept` ou
`match` dans la réponse.

### 10.2 Le contrôle d'accès est serveur, aux trois points d'entrée
`ownedLevels()` est revérifié dans le catalogue, dans la lecture par slug
(**prévention d'IDOR**) et à **chaque** soumission. Masquer un bouton n'est pas
un contrôle d'accès.

### 10.3 Force brute
Plafond de 3 tentatives sur un QCM, 40 sur une réponse libre. La réponse ne dit
jamais « proche », ni quelle option était fausse. Le score est **calculé côté
serveur**.

*Soyons honnêtes sur ce que cela vaut* : sur quatre options, aucun plafond
n'empêche de deviner. Ce qui porte la valeur est la **conséquence révélée**,
qu'un devineur saute sans rien apprendre.

### 10.4 Le shell n'exécute rien
Registre fixe de commandes. Aucun `eval`, aucun `new Function`, **aucun accès
réseau**. Un laboratoire capable d'atteindre Internet deviendrait une
infrastructure d'attaque portant notre nom de domaine.

### 10.5 Les pièces sont du texte, jamais du HTML
Aucun `dangerouslySetInnerHTML` : un compte admin compromis ne peut pas devenir
une exécution de script chez chaque étudiant. Les images doivent être de même
origine ou `data:`, et le disent quand elles ne le sont pas.

### 10.6 Aucune donnée personnelle réelle
Personnes, entreprises, adresses, documents « fuités » : tout est fabriqué. Le
cas OSINT est le piège évident — l'écrire sur une vraie personne serait un
traitement sans base légale.

### 10.7 Aucun code malveillant réel
Pas d'échantillon, même inerte. Pas d'exploit fonctionnel. Une charge
illustrative est un objet d'analyse, pas une arme.

### 10.8 Traçabilité
`logAudit()` sur création, modification et suppression. Supprimer un cas
supprime ses résolutions — le dialogue l'annonce avant.

### 10.9 Ce qui existait déjà et n'a pas été cassé
CSP **appliquée** en production, HSTS, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy`, authentification Clerk, limitation de débit, journal d'audit.

---

## 11. Ce qui reste

| Élément | État |
|---|---|
| Moteur de cas, correction, verrouillage par pack | ✅ |
| webOS : démarrage, session, bureau, fenêtres | ✅ |
| 8 types de pièces | ✅ |
| Correction tolérante (3 modes) | ✅ |
| Barrière desktop | ✅ |
| Rédaction dans l'admin | ✅ |
| Répondre depuis le bureau (application Dossier) | ✅ |
| Manuel obligatoire avant chaque session WebOS | ✅ |
| Menus contextuels du bureau et des pièces | ✅ |
| Centre admin avec onglets Pratiques / Challenges | ✅ |
| Création et modification dans des modales fermées par défaut | ✅ |
| Test admin sans progression, avec ou sans guide complet | ✅ |
| 4 cas écrits | ✅ |
| Cas publiés sur le déploiement de développement | 4 |
| Publication de « 02h37 : exfiltration lente » | ✅ |
| **18 cas restants** | à écrire |
| Sauvegarde de l'état du bureau entre deux visites | non prévu |

### Répondre sans quitter le bureau
C'est fait. Une application **Dossier** vit dans le dash du bureau : elle
affiche les étapes du cas, l'indice, le plafond de tentatives et révèle la
conséquence après une bonne réponse — le tout sans fermer la session. La
correction passe par la même mutation serveur que le panneau « Investigation »,
donc les deux vues ne peuvent pas être en désaccord : elles partagent le
contrat, pas les réponses.

---

## 12. Écrire un cas

La rédaction courante se fait depuis `/admin/labs`. Le fichier
`convex/caseSeeds.ts` sert uniquement à installer de façon idempotente le cas
Avancé livré avec cette refonte ; son exécution exige un compte administrateur.

1. **Métadonnées** — titre, catégorie, niveau, durée, gratuit, publié.
2. **Résumé** — visible même verrouillé : donner envie sans rien dévoiler.
3. **Mise en situation** — planter la scène en trois lignes.
4. **Pièces** — ajouter un type ; un gabarit pré-rempli montre la forme
   attendue. « Prévisualiser » les affiche telles que l'étudiant les verra.
5. **Étapes** — question, mode de correction, réponse, formulations
   alternatives, indice, conséquence, points.
6. **Publier.**

⚠ Enregistrer un cas existant **remplace** ses pièces et ses étapes, et remet à
zéro la progression des étudiants dessus. C'est délibéré : après reformulation
d'une question, aucune règle honnête ne permet de décider qu'une ancienne
réponse compte encore.

---

## 13. Le vrai risque

Ce n'est pas la technique — elle est faite.

**15 formations publiées, 1 leçon.** Quatorze pages de cours vendent quelque
chose qui n'existe pas. Le moteur de simulation n'y remédie pas : il ajoute une
seconde bibliothèque presque vide.

La recommandation tient en une phrase : **mettre les quatre cas devant de vrais
étudiants et regarder s'ils les jouent jusqu'au bout**, avant d'écrire les
dix-huit autres.
