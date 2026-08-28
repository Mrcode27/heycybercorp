# heycybercorp — Environnement de simulation (« webOS »)

> Document de conception. Décrit **ce qu'on construit**, **pour qui**, **où
> exactement dans le dépôt**, et **sous quelles contraintes de sécurité**.
> Rien de ce qui suit n'est codé, sauf ce qui porte la mention **[existe]**.

---

## 1. Ce que c'est — et ce que ce n'est pas

**Ce n'est pas un système d'exploitation.** Ni émulation de Linux, ni machine
virtuelle, ni conteneurs loués à l'heure.

**C'est une simulation scénarisée.** L'étudiant n'apprend pas `chmod` : il est
l'analyste de permanence quand quelque chose tourne mal, et il traite le dossier.

| | Émulateur d'OS | Simulation scénarisée |
|---|---|---|
| Ce qu'on écrit | des commandes | des situations |
| Ce qui casse l'illusion | `command not found` | rien : il n'y a rien à émuler |
| Coût serveur par étudiant | élevé (VM) ou lourd (WASM) | **nul** |
| Ce qu'on enseigne | une syntaxe | **le jugement** |

Le terminal reste utile, mais comme **un artefact parmi d'autres**, ouvert quand
le cas l'exige — pas comme le contenant de tout le reste.

---

## 2. Public : l'espace francophone, sans localisme

Le contenu s'adresse à **toute la francophonie** — France, Belgique, Suisse,
Québec, Cameroun, Sénégal, Côte d'Ivoire, RDC, Maroc, Tunisie. Un étudiant à
Douala et un étudiant à Lyon doivent se reconnaître dans le même cas, sans que
l'un ait l'impression de lire le courrier de l'autre.

### La règle : entités fictives, mécanismes réels

Aucun cas ne cite une marque, une administration ou une banque réelle. On
invente des entités plausibles et neutres :

| Rôle dans le récit | Entité fictive |
|---|---|
| Transporteur | **RapidColis** |
| Banque | **Banque Méridienne** |
| Opérateur télécom / paiement mobile | **Talia Mobile** |
| Assurance santé | **AssurLibre** |
| Employeur du scénario | **Groupe Sévigné** |
| Réseau social | **Voltis** |

Trois raisons, toutes solides :

1. **Neutralité géographique.** « Votre colis RapidColis est en attente » se lit
   pareil à Dakar et à Bruxelles. Citer une administration nationale exclut
   immédiatement les trois quarts du public.
2. **Responsabilité.** Un cas de phishing rédigé autour d'une vraie marque
   constitue, littéralement, un modèle de phishing prêt à l'emploi contre elle.
   On enseigne le mécanisme, on ne livre pas l'outil.
3. **Durabilité.** Une interface réelle change ; le mécanisme, non.

Ce que l'étudiant doit reconnaître, ce n'est pas un logo : c'est **l'urgence
fabriquée, l'autorité usurpée, le canal détourné**.

### Le cadre réglementaire, enseigné en comparatif

Plutôt que d'enseigner une seule loi, on enseigne **l'obligation de notification
et ses délais**, en montrant qu'ils diffèrent selon le pays :

| Espace | Texte | Délai de notification |
|---|---|---|
| Union européenne | RGPD | 72 h à l'autorité de contrôle |
| Suisse | nLPD | « dans les meilleurs délais » |
| Québec | Loi 25 | « avec diligence » |
| Union africaine | Convention de Malabo | transposition nationale |
| Afrique francophone | lois nationales (autorités de protection des données) | variable |

C'est plus utile qu'un cours mono-pays, et c'est un vrai différenciateur : les
plateformes anglophones n'enseignent aucun de ces régimes.

---

## 3. Décision : poste fixe uniquement

Les laboratoires sont **réservés au desktop**. Sur petit écran on n'affiche pas
une version dégradée, mais une invitation à revenir sur ordinateur.

### Pourquoi

C'est le choix de toutes les plateformes comparables — TryHackMe (AttackBox),
Hack The Box (Pwnbox), CompTIA (CertMaster Labs), Coursera. Aucune ne propose
ses environnements pratiques sur téléphone : un bureau distant dans un écran de
six pouces, sans Ctrl et sans Tab, n'est pas utilisable.

### Trois conditions attachées à cette décision

1. **Seuls les labs sont concernés.** Vitrine, catalogue, tarifs, paiement et
   lecture des cours restent pleinement mobiles.
2. **Le catalogue des cas reste consultable sur mobile.** On doit pouvoir voir
   ce qu'on achète avant de pouvoir le jouer.
3. **Le refus est utile, jamais un mur.**

### Détection

Pas de `User-Agent` : peu fiable et trivial à contourner. Deux signaux combinés :

- largeur de fenêtre `< 1024 px`
- pointeur grossier (`pointer: coarse`) sans clavier physique

### Écran affiché

> **Ce laboratoire demande un ordinateur.**
> Les cas pratiques ouvrent un terminal et plusieurs fenêtres d'analyse :
> il faut un clavier physique et un écran large.
>
> `L'Élite du Terminal ne se forme pas au pouce.`
>
> — [Voir le catalogue des cas] · [M'envoyer le lien par email] · [Continuer quand même]

Le « continuer quand même » est délibéré : une tablette en paysage avec clavier
s'en sort très bien, et un mur absolu ferait fuir un étudiant curieux.

---

## 4. Anatomie d'un cas

```
CAS
├── Mise en situation   « 03h14. Un salarié signale un email. 3 min avant escalade. »
├── Artefacts           les pièces du dossier (§5)
├── Étapes 3 à 6        chacune : une question, une vérification, un indice optionnel
└── Verdict             UNE décision finale, pas un score de QCM
```

- **Une seule décision finale.** Le reste instruit le dossier.
- **Les mauvaises réponses doivent être plausibles.** Un phishing évident
  n'enseigne rien.
- **Montrer la conséquence** : « vous avez cliqué : 4 200 comptes exposés. »
- **3 à 6 étapes.** Au-delà, c'est un devoir maison.
- **Pression temporelle dans le récit, jamais de minuteur réel.**
- **Crédit partiel** : chaque étape validée compte.

---

## 5. Les artefacts — ce que « webOS » veut dire

L'écran est un poste de travail d'analyste : plusieurs panneaux, chacun portant
une pièce du dossier.

| Artefact | Rendu | Usage |
|---|---|---|
| `email` | client mail, en-têtes dépliables | phishing, fraude au président |
| `log` | visionneuse ligne à ligne + recherche | `auth.log`, accès web |
| `terminal` | shell restreint | fouiller un système |
| `file` | arborescence + aperçu | dépôt git, disque |
| `table` | tableau triable | flux réseau, journaux de badge |
| `http` | requête / réponse brutes | en-têtes, certificats |
| `image` | capture | page de phishing, alerte |

### Le terminal

Shell **scopé au cas** : chaque cas déclare son système de fichiers et la liste
des commandes autorisées.

- **`help` liste tout ce qui existe** — contrat explicite, rien de caché.
- Une commande hors périmètre répond « non disponible dans ce laboratoire »,
  jamais `command not found`, qui ferait croire à un défaut.
- Le moteur existe **[existe]** (`src/components/HeroTerminal.tsx`, 33 commandes,
  Tab, historique). Il faut l'extraire et le rendre paramétrable.

Le terminal apparaît dans **environ un tiers** des cas, jamais dans le tier
gratuit : on n'accueille pas un débutant par une invite de commande.

---

## 6. Les quatre tiers

**Le tier se mesure à la profondeur, pas au nombre.** « Vous en avez 3 au lieu
d'1 » donne le sentiment d'être rationné ; « vous avez les investigations
complètes » se vend seul.

Cible : **Gratuit 2 · Débutant 6 · Intermédiaire 7 · Avancé 7**.

### Gratuit — la vitrine

Aucun terminal, moins de trois minutes, doit produire un déclic.

| Cas | Compétence |
|---|---|
| **« Votre colis est en attente »** | SMS RapidColis : vrai expéditeur, vraie destination du lien |
| **« Le code à 6 chiffres »** | un « ami » demande de transférer un code reçu — détournement de compte |

On n'achète pas après un exposé sur la triade CIA. On achète après avoir compris
qu'on serait tombé dans le piège.

### Tier 1 · Débutant — reconnaître

| Cas | Compétence | Terminal |
|---|---|---|
| **Le domaine qui n'est pas le bon** | typosquat, homoglyphes, sous-domaine trompeur | non |
| **Le mot de passe réutilisé** | rayon d'impact d'une fuite | non |
| **La fraude au président** | pression hiérarchique, vérification hors canal | non |
| **L'arnaque au virement instantané** | irréversibilité du paiement — mobile ou bancaire | non |
| **Le Wi-Fi ouvert** | faux point d'accès jumeau | non |
| **Première session terminal** | prise en main : `ls`, `cat`, trouver l'intrus | **oui** |

*L'arnaque au virement instantané* est le cas-pont : paiement mobile en Afrique,
virement instantané en Europe, **même mécanisme, même irréversibilité**.

### Tier 2 · Intermédiaire — analyser

| Cas | Compétence | Terminal |
|---|---|---|
| **03h14 : connexion réussie** | force brute dans `auth.log` : IP, bascule, réaction | **oui** |
| **Le serveur qui parle trop** | en-têtes + scan → exposition, priorisation | **oui** |
| **Le processus fantôme** | `ps` / `netstat` : balise et port de commande | **oui** |
| **OSINT : le prestataire** | empreinte publique, métadonnées de documents | non |
| **Le certificat qui ne colle pas** | lire une chaîne TLS | non |
| **Le `.env` dans le dépôt** | secret commité — pourquoi le supprimer ne suffit pas | **oui** |
| **Trois alertes, dix minutes** | triage : classer et justifier | non |

Le dernier est le plus proche du métier réel.

### Tier 3 · Avancé — investigations complètes

| Cas | Compétence |
|---|---|
| **Compromission d'un compte Voltis** | chaîne complète : page de phishing → cookie de session → reset 2FA → email de récupération remplacé |
| **Handshake capturé** | WPA2 : identifier le handshake, expliquer la faiblesse d'une PSK |
| **Chronologie d'une intrusion** | reconstituer 8 événements, vecteur initial, temps de présence |
| **Le ransomware du vendredi soir** | payer / restaurer / négocier — **et notifier qui, dans quel délai, selon le pays** |
| **Exfiltration lente** | tunnel DNS : anomalie de volume et d'entropie |
| **L'insider** | badges + accès fichiers + RH : malveillance ou coïncidence ? |
| **Le rapport à la direction** | synthèse pour un comité non technique |

- **L'insider** doit pouvoir se gagner en concluant *« les preuves ne suffisent
  pas à accuser »*. Enseigner la retenue est rare, et c'est ce qui sépare un
  professionnel d'un danger public.
- **Le rapport à la direction** enseigne la compétence qui décide des
  promotions. Presque aucune plateforme ne la couvre.

---

## 7. Où le système se construit — placement exact

Le dépôt suit déjà une séparation nette : **Convex pour les données et les
règles, `src/` pour l'interface**. Le nouveau système s'y insère sans rien
déplacer.

### Backend — Convex

| Fichier | Rôle |
|---|---|
| `convex/schema.ts` | **modifier** : ajouter `cases`, `caseArtifacts`, `caseSteps`, `caseProgress` |
| `convex/cases.ts` | **créer** : `listForStudent`, `getCase`, `submitStep`, + CRUD admin |
| `convex/entitlements.ts` | **réutiliser** : `ownedLevels()` pour le verrouillage par pack **[existe]** |
| `convex/users.ts` | **réutiliser** : `getCurrentUser()`, `requireAdmin()` **[existe]** |
| `convex/lib/audit.ts` | **réutiliser** : `logAudit()` sur chaque écriture admin **[existe]** |
| `convex/labs.ts` | **[existe]** — reste en place ; les labs à flag unique cohabitent avec les cas |

### Frontend — étudiant

| Fichier | Rôle |
|---|---|
| `src/app/dashboard/labs/page.tsx` | **modifier** : catalogue (reste mobile) **[existe]** |
| `src/app/dashboard/labs/[slug]/page.tsx` | **créer** : la page d'un cas |
| `src/components/console/CaseRunner.tsx` | **créer** : orchestration étapes + artefacts |
| `src/components/console/artifacts/` | **créer** : `EmailArtifact`, `LogArtifact`, `TerminalArtifact`, `FileArtifact`, `TableArtifact`, `HttpArtifact`, `ImageArtifact` |
| `src/components/DesktopOnlyGate.tsx` | **créer** : la barrière du §3 |
| `src/lib/shell/` | **créer** : moteur de terminal extrait de `HeroTerminal.tsx`, paramétrable par cas |
| `src/components/HeroTerminal.tsx` | **modifier** : devient un consommateur de `src/lib/shell/` **[existe]** |

### Frontend — admin

| Fichier | Rôle |
|---|---|
| `src/app/admin/labs/page.tsx` | **modifier** : onglets « Labs » / « Cas » **[existe]** |
| `src/components/console/AdminCases.tsx` | **créer** : rédaction (métadonnées, artefacts, étapes, prévisualisation) |
| `src/components/consoleNav.ts` | **[existe]** — l'entrée « Labs » couvre déjà les deux |

### Transverse

| Fichier | Rôle |
|---|---|
| `src/app/globals.css` | **modifier** : styles des artefacts, jetons `--color-terminal` **[existe]** |
| `next.config.ts` | **vérifier** : la CSP couvre les artefacts (§8) **[existe]** |
| `src/proxy.ts` | **[existe]** — `/dashboard(.*)` est déjà protégé, rien à changer |

---

## 8. Sécurité — contraintes non négociables

Une plateforme qui enseigne la sécurité et qui échoue à un audit n'a plus
d'argument commercial. Chaque point ci-dessous est une **condition de recette**.

### 8.1 Les réponses ne quittent jamais le serveur

Comme pour les labs actuels **[existe]** : la requête destinée à l'étudiant
**construit sa réponse champ par champ**, elle n'étale jamais le document. Un
champ ajouté au schéma ne peut donc pas fuiter par inadvertance.

- Un cas verrouillé renvoie `brief: null`, **pas** une chaîne masquée côté client.
- Une étape non résolue ne renvoie ni `answer`, ni la bonne option d'un QCM.
- **Recette :** appeler la fonction déployée et vérifier zéro occurrence de la
  réponse dans la charge utile. C'est déjà la procédure appliquée aux labs.

### 8.2 Le contrôle d'accès est serveur, jamais UI

Masquer un bouton n'est pas un contrôle d'accès. `ownedLevels()` est revérifié :

- dans `listForStudent` (ce qu'on voit)
- dans `getCase` (accès direct par slug — **prévention d'IDOR**)
- dans `submitStep` (à chaque soumission)

Un étudiant qui devine l'URL d'un cas Avancé doit être refusé par le serveur.

### 8.3 Anti-force brute sur les étapes

Un QCM à quatre choix se casse en quatre essais. Donc :

- **plafond de tentatives par étape** (référence : 100 sur les labs **[existe]**,
  à resserrer à ~10 pour un QCM) ;
- la réponse ne dit **jamais** « proche » ni quelle option était fausse ;
- le score est **calculé côté serveur**, jamais accepté depuis le client.

### 8.4 Le shell simulé n'exécute rien

Le terminal est un **registre fixe de commandes**. Interdits absolus dans
`src/lib/shell/` :

- `eval()`, `new Function()`, `setTimeout("chaîne")` — aucune évaluation
  dynamique de saisie utilisateur ;
- tout accès réseau : le shell ne fait **aucun** `fetch`. Un lab qui atteint
  Internet devient une infrastructure d'attaque relayée par notre domaine ;
- toute écriture hors du système de fichiers virtuel en mémoire.

### 8.5 Le contenu des artefacts est du texte, jamais du HTML

Les cas sont rédigés par un admin, mais **un compte admin compromis ne doit pas
devenir une exécution de script** chez chaque étudiant.

- Rendu en texte (`whitespace-pre-wrap`), **jamais** `dangerouslySetInnerHTML`.
- Les artefacts `image` sont hébergés par nous ou en `data:` — la CSP en
  production **[existe]** bloque déjà les hôtes tiers, et c'est voulu.
- Aucun artefact ne peut introduire d'origine externe sans modification
  explicite de `next.config.ts`.

### 8.6 Aucune donnée personnelle réelle dans les cas

Le cas **OSINT : le prestataire** est le piège évident : construire un exercice
sur une vraie personne serait un traitement de données personnelles sans base
légale, en plus d'être déloyal.

- Personnes, entreprises, adresses, numéros : **fictifs**.
- Les documents « fuités » d'un cas sont fabriqués pour l'occasion.

### 8.7 Aucun code malveillant réel

Les cas décrivent des mécanismes ; ils ne livrent pas d'outil.

- Pas d'échantillon de malware, même inerte : faux positifs antivirus,
  responsabilité d'hébergement, et aucun gain pédagogique.
- Pas d'exploit fonctionnel. Une charge illustrative (`1' OR '1'='1`) est un
  objet d'analyse, pas une arme.

### 8.8 Traçabilité

`logAudit()` **[existe]** sur toute écriture admin : création, modification,
publication, suppression d'un cas. Supprimer un cas supprime ses résolutions —
le dialogue de confirmation doit l'annoncer, comme pour les labs **[existe]**.

### 8.9 Ce qui existe déjà et qu'il ne faut pas casser

| Contrôle | État |
|---|---|
| CSP **appliquée** en production | **[existe]** |
| HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` | **[existe]** |
| Authentification déléguée (Clerk), `/dashboard(.*)` protégé | **[existe]** |
| Limitation de débit sur les formulaires publics | **[existe]** |
| Journal d'audit | **[existe]** |

**Recette avant mise en ligne :** exécuter la revue de sécurité sur le diff, et
vérifier qu'aucune origine n'a été ajoutée à la CSP sans justification.

---

## 9. Modèle de données (esquisse)

```
cases          titre, slug, niveau, catégorie, isFree, publié, ordre,
               miseEnSituation, dureeEstimee, points

caseArtifacts  caseId, type (email|log|terminal|file|table|http|image),
               libellé, contenu

caseSteps      caseId, ordre, question, type (texte|choix|multiple),
               choix[], réponse, indice, points

caseProgress   userId, caseId, étapeCourante, réponses[], terminéLe, score
```

Pour un artefact `terminal`, `contenu` porte le système de fichiers du cas et la
liste blanche de commandes.

---

## 10. État actuel

| Élément | État |
|---|---|
| Labs : verrouillage par pack, points, résolution | **[existe]** |
| Vérification serveur, réponse jamais exposée | **[existe]** |
| Admin : créer / éditer / publier / supprimer | **[existe]** |
| Moteur de terminal (33 commandes, Tab, historique) | **[existe]** — à extraire |
| 6 labs à flag unique, dont 2 gratuits | **[existe]** |
| Étapes multiples · artefacts · barrière desktop | à faire |
| Rédaction des cas dans l'admin | à faire |
| Les 22 cas | à écrire |

---

## 11. Ordre de construction

**Phase 1 — le moteur et trois cas.** Étapes multiples, artefacts `email` /
`log` / `terminal`, barrière desktop. Trois cas seulement, choisis pour exercer
chaque mécanisme : « Le code à 6 chiffres » (gratuit), « La fraude au président »
(Débutant), « 03h14 : connexion réussie » (Intermédiaire, terminal).
But : valider le format avant d'écrire vingt cas dans un format à jeter.

**Phase 2 — la rédaction dans l'admin.** Sans elle, chaque nouveau cas passe par
un développeur.

**Phase 3 — les artefacts restants.** `file`, `table`, `http`, `image`.

**Phase 4 — le contenu.** Les 19 cas restants, par tier.

---

## 12. Le vrai risque

Ce n'est pas la technique. C'est que **le développement remplace la production de
contenu**.

À ce jour : **15 formations publiées, 1 leçon**. Quatorze pages de cours vendent
quelque chose qui n'existe pas. Un moteur de simulation parfait n'y remédie pas —
il ajoute une seconde bibliothèque vide.

La recommandation tient en une phrase : **construire la Phase 1, écrire trois
cas, les mettre en ligne, et regarder si quelqu'un les joue** avant d'écrire les
dix-neuf autres.
