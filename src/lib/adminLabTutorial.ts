export type TutorialAction = {
  title: string;
  instruction: string;
  command?: string;
  observe?: string;
};

export type TutorialStep = {
  title: string;
  question: string;
  mindset: string;
  hypothesis: string;
  actions: TutorialAction[];
  proof: string;
  transfer: string;
  answer?: string;
};

export type LabTutorial = {
  problem: string;
  stakes: string;
  mission: string;
  mentalModel: string[];
  preparation: TutorialAction[];
  steps: TutorialStep[];
};

type PracticalStep = {
  order: number;
  prompt: string;
  kind: "text" | "choice";
  choices: string[];
  answer: string;
  hint?: string | null;
  reveal?: string | null;
};

type PracticalInput = {
  slug: string;
  title: string;
  summary: string;
  setting: string;
  category: string;
  artifacts: Array<{ kind: string; label: string; content: string }>;
  steps: PracticalStep[];
};

type ChallengeInput = {
  slug: string;
  title: string;
  summary: string;
  brief: string;
  category: string;
  flag: string;
  hint?: string | null;
};

const CORE_MINDSET = [
  "Séparez les faits observables de votre intuition : une alerte lance l’enquête, elle ne prouve pas encore l’incident.",
  "Formulez une hypothèse falsifiable, puis cherchez une deuxième source qui la confirme ou la contredit.",
  "Construisez une chronologie. L’ordre des événements révèle souvent davantage que leur volume.",
  "Contenez avant d’éradiquer : coupez l’attaque sans détruire les preuves nécessaires à l’attribution et à la portée.",
];

const WEBOS_PREPARATION: TutorialAction[] = [
  {
    title: "Entrer dans l’environnement",
    instruction: "Lancez le poste simulé, passez-le en plein écran si nécessaire et lisez le dossier déjà ouvert. Ne répondez encore à aucune question.",
    observe: "Vous devez pouvoir reformuler l’alerte, le périmètre et ce que l’on vous demande de prouver.",
  },
  {
    title: "Ouvrir le Terminal",
    instruction: "Cliquez sur Terminal dans le dock. Vérifiez d’abord où vous êtes et sous quelle identité vous travaillez.",
    command: "whoami\npwd",
    observe: "Vous travaillez comme analyste dans un environnement de preuve en lecture seule.",
  },
  {
    title: "Inventorier avant de chercher",
    instruction: "Listez les pièces disponibles. Un analyste choisit ensuite la source adaptée à la question au lieu de lire tous les fichiers au hasard.",
    command: "ls",
    observe: "Repérez le journal réseau ou d’authentification, la télémétrie hôte et tout inventaire ou chronologie.",
  },
  {
    title: "Lire la mission",
    instruction: "Ouvrez le fichier de mission visible dans le gestionnaire de fichiers, ou affichez-le dans le terminal.",
    command: "cat mission.txt\n# Si mission.txt n’existe pas : cat question.txt",
    observe: "Notez les objectifs dans l’ordre : source, moment ou mécanisme, action post-compromission, puis confinement.",
  },
];

export function buildPracticalTutorial(item: PracticalInput): LabTutorial {
  if (item.slug === "03h14-connexion-reussie") return sshTutorial(item);
  if (item.slug === "02h37-exfiltration-lente") return dnsTutorial(item);
  if (item.slug === "la-fraude-au-president") return phishingTutorial(item);
  if (item.slug === "le-code-a-6-chiffres") return otpTutorial(item);
  return genericPracticalTutorial(item);
}

function sshTutorial(item: PracticalInput): LabTutorial {
  const steps = ordered(item.steps);
  return {
    problem: "Le SIEM signale beaucoup d’échecs SSH, mais le volume n’est pas encore la compromission. Le vrai basculement est la première authentification acceptée, puis ce que le compte fait immédiatement après.",
    stakes: "Si vous confondez bruit et preuve, vous risquez de bloquer la mauvaise adresse. Si vous redémarrez trop tôt, vous perdez les processus, connexions et traces volatiles qui expliquent la suite de l’intrusion.",
    mission: "Passer d’une alerte brute à une chaîne de preuve : succès SSH → heure de bascule → commande privilégiée → décision de confinement réversible.",
    mentalModel: CORE_MINDSET,
    preparation: WEBOS_PREPARATION.map((action) => action.title === "Lire la mission" ? { ...action, command: "cat question.txt" } : action),
    steps: [
      makeStep(steps[0], {
        title: "Trouver le point de bascule",
        mindset: "Un attaquant peut provoquer des centaines de lignes « Failed ». Une seule ligne « Accepted » suffit pour transformer une tentative en intrusion.",
        hypothesis: "L’adresse qui obtient un « Accepted password » est la source à suivre, même si d’autres adresses ont davantage échoué.",
        actions: [
          action("Filtrer le signal utile", "Dans Terminal, ne parcourez pas tout le journal à l’œil. Demandez uniquement les authentifications réussies.", "grep \"Accepted\" auth.log", "Une ligne unique apparaît avec l’utilisateur admin et l’adresse source."),
          action("Comparer au bruit précédent", "Affichez ensuite les tentatives de la même adresse pour confirmer qu’elle a enchaîné les essais avant le succès.", `grep "${steps[0]?.answer ?? "ADRESSE_TROUVÉE"}" auth.log`, "La même source échoue plusieurs fois puis réussit : la séquence est cohérente avec une force brute réussie."),
        ],
        proof: "La preuve n’est pas « cette IP échoue souvent », mais « cette IP est portée par l’événement Accepted ». C’est cette ligne qui attribue l’accès initial.",
        transfer: "Dans tout journal d’authentification, cherchez d’abord l’événement de réussite, puis remontez son contexte. Ne classez jamais une IP seulement par nombre d’échecs.",
      }),
      makeStep(steps[1], {
        title: "Fixer l’heure zéro de l’incident",
        mindset: "L’horodatage du succès devient T0. Les événements immédiatement postérieurs appartiennent potentiellement à l’attaquant.",
        hypothesis: "L’heure recherchée est sur la même ligne Accepted ; inutile d’inventer une heure à partir de l’alerte SIEM de 03h14.",
        actions: [
          action("Relire la ligne de preuve", "Exécutez le même filtre et lisez les trois premiers champs de la ligne : mois, jour et heure.", "grep \"Accepted\" auth.log", "Le succès précède l’alerte SIEM. Cela montre que l’heure de détection et l’heure de compromission sont différentes."),
          action("Tracer la fenêtre post-compromission", "Affichez les dernières lignes du journal pour voir les événements qui suivent T0.", "tail auth.log", "Une commande sudo, puis une requête SFTP, apparaissent après l’authentification."),
        ],
        proof: "L’heure exacte de l’événement Accepted est la frontière défendable entre tentative et accès obtenu.",
        transfer: "Dans une investigation, distinguez toujours T0 compromission, T0 détection et T0 réponse. Les trois heures sont rarement identiques.",
      }),
      makeStep(steps[2], {
        title: "Reconstituer la première action privilégiée",
        mindset: "Après l’accès, cherchez les changements de privilège, installations, téléchargements et mécanismes de persistance.",
        hypothesis: "Le compte admin a utilisé sudo peu après T0 pour installer un outil qui facilite une connexion ou un transfert.",
        actions: [
          action("Filtrer les actions privilégiées", "Cherchez les lignes sudo : elles conservent l’utilisateur, le répertoire et la commande exacte.", "grep \"sudo\" auth.log", "La commande d’installation apparaît 32 secondes après le succès SSH."),
          action("Interpréter l’outil, pas seulement son nom", "Demandez-vous à quoi sert l’outil installé : créer une écoute, ouvrir un canal ou transférer des données. Corrélez ensuite avec la ligne SFTP.", "grep \"sftp\" auth.log", "La proximité installation → SFTP renforce l’hypothèse d’une préparation d’exfiltration ou d’accès distant."),
        ],
        proof: "La chronologie lie l’adresse compromise, la session admin, l’élévation de privilèges et l’installation de l’outil.",
        transfer: "Un binaire courant peut être détourné. Jugez un outil par son contexte d’exécution, son parent, son heure et les connexions qui suivent.",
      }),
      makeStep(steps[3], {
        title: "Contenir sans effacer l’histoire",
        mindset: "Le premier geste doit arrêter la capacité de nuire tout en conservant l’état de la machine. Éradication et restauration viennent après l’acquisition des preuves.",
        hypothesis: "L’isolation réseau coupe l’attaquant ; le blocage de la source réduit le risque ; la conservation des journaux maintient l’enquête possible.",
        actions: [
          action("Éliminer les mauvaises options", "Barrez toute action qui détruit la mémoire ou les traces, qui ne coupe pas la session, ou qui reporte la réponse.", undefined, "Le redémarrage détruit du volatile ; changer seulement le mot de passe ne supprime ni processus ni persistance ; supprimer seulement l’outil altère les preuves."),
          action("Choisir une action réversible", "Privilégiez l’isolation réseau/EDR, le blocage de l’indicateur et la préservation des journaux avant toute suppression.", undefined, "La menace est contenue, mais la machine reste disponible pour l’acquisition mémoire et l’analyse forensique."),
        ],
        proof: "La meilleure décision couvre simultanément les deux objectifs : réduire l’impact maintenant et préserver la capacité d’expliquer l’incident ensuite.",
        transfer: "Le réflexe IR est : contenir, acquérir, analyser, éradiquer, restaurer. Une action rapide n’est bonne que si elle ne détruit pas la preuve nécessaire.",
      }),
    ],
  };
}

function dnsTutorial(item: PracticalInput): LabTutorial {
  const steps = ordered(item.steps);
  return {
    problem: "Le poste émet peu de trafic, mais les requêtes DNS TXT sont régulières, longues et à forte entropie. Un attaquant peut cacher des fragments de données dans un protocole normalement autorisé pour rester sous les seuils volumétriques.",
    stakes: "Le poste appartient au service paie. Il faut prouver la chaîne réseau → processus → fichier avant de contenir, car une simple anomalie DNS ne suffit pas à affirmer qu’une donnée sensible a quitté le réseau.",
    mission: "Attribuer la source, qualifier le canal, relier le trafic à un processus et à un fichier, puis choisir un confinement qui protège le parc et les preuves.",
    mentalModel: CORE_MINDSET,
    preparation: WEBOS_PREPARATION,
    steps: [
      makeStep(steps[0], {
        title: "Attribuer la source réseau",
        mindset: "Commencez par l’indicateur fourni par l’alerte—le domaine—puis remontez à la source. Ne partez pas d’un poste supposé coupable.",
        hypothesis: "Une même adresse source génère les rafales TXT vers sync-check.test.",
        actions: [
          action("Isoler les requêtes signalées", "Filtrez le journal DNS sur le domaine de l’alerte.", "grep \"sync-check\" dns.log", "Toutes les requêtes anormales partagent la même valeur src, tandis que les lignes normales viennent de plusieurs postes."),
          action("Donner un contexte métier à l’IP", "Une IP seule n’est pas une attribution. Recherchez-la dans l’inventaire après l’avoir découverte dans le premier résultat.", `grep "${steps[0]?.answer ?? "IP_TROUVÉE"}" inventaire.csv`, "La ligne d’inventaire transforme l’adresse technique en poste, propriétaire métier et niveau de criticité."),
        ],
        proof: "Deux sources indépendantes se rejoignent : dns.log établit l’origine technique et inventaire.csv identifie l’actif et son propriétaire.",
        transfer: "Attribuez toujours un indicateur réseau à un actif métier. L’IP dit où regarder ; l’inventaire dit pourquoi l’incident est important.",
      }),
      makeStep(steps[1], {
        title: "Qualifier le canal caché",
        mindset: "DNS est attendu sur un réseau. Ce qui devient suspect est la forme : type TXT, sous-domaines longs et changeants, forte entropie, numéros de séquence et périodicité régulière.",
        hypothesis: "Les labels de sous-domaines transportent des fragments encodés plutôt qu’un simple nom d’hôte.",
        actions: [
          action("Observer la structure", "Relisez uniquement les requêtes du domaine et comparez type, longueur, contenu et cadence.", "grep \"sync-check\" dns.log", "Vous voyez des requêtes TXT, des blocs pseudo-aléatoires suffixés -001, -002… et des rafales toutes les 60 secondes."),
          action("Vérifier la périodicité", "Corrélez les heures avec la chronologie préparée par la sonde.", "cat chronologie.txt", "Le même motif revient à intervalle stable, comportement typique d’un agent automatisé à faible débit."),
        ],
        proof: "Aucun indice pris seul ne suffit. Ensemble—TXT + entropie + séquences + périodicité—ils forment une signature cohérente de tunneling DNS.",
        transfer: "Pour détecter un canal caché, comparez protocole attendu et usage inattendu. Cherchez la régularité, l’entropie et le fractionnement des données.",
      }),
      makeStep(steps[2], {
        title: "Passer du réseau au processus",
        mindset: "Une détection réseau devient actionnable quand elle est reliée à un processus local. C’est le pivot entre « trafic suspect » et « exécution sur l’hôte ».",
        hypothesis: "La télémétrie EDR attribue les requêtes au même PID, que l’inventaire de processus permet ensuite d’identifier.",
        actions: [
          action("Corréler le domaine dans l’EDR", "Cherchez le même indicateur réseau dans la télémétrie hôte.", "grep \"sync-check\" edr.log", "Chaque dns_query porte le même identifiant de processus."),
          action("Identifier l’exécutable", "Utilisez le PID trouvé dans l’EDR pour interroger l’inventaire des processus.", `grep "${steps[2]?.answer ?? "PID_TROUVÉ"}" processus.txt`, "La ligne associe ce PID à un exécutable, un compte de service et une socket UDP vers le résolveur."),
        ],
        proof: "Le domaine, le PID, le programme et la socket DNS sont alignés. Le nom telemetry.py peut sembler légitime, mais la corrélation comportementale l’emporte sur son étiquette.",
        transfer: "Pivotez systématiquement indicateur réseau → télémétrie hôte → processus → parent/utilisateur → connexions. Ne faites jamais confiance au nom d’un binaire.",
      }),
      makeStep(steps[3], {
        title: "Déterminer la donnée exposée",
        mindset: "Pour parler d’exfiltration, il faut relier le processus émetteur à une ressource lue juste avant le trafic.",
        hypothesis: "Le même PID ouvre un fichier sensible une seconde avant la première rafale DNS.",
        actions: [
          action("Chercher les accès fichiers", "Filtrez l’EDR sur l’événement file_open.", "grep \"file_open\" edr.log", "Le même PID ouvre un fichier d’export juste avant le premier dns_query."),
          action("Confirmer par une deuxième trace", "Contrôlez les descripteurs ouverts du processus dans l’inventaire.", `grep "${steps[2]?.answer ?? "PID_TROUVÉ"}" processus.txt`, "Le fichier est ouvert en lecture par le même PID qui possède la socket UDP."),
        ],
        proof: "La proximité temporelle et l’identité du PID relient le fichier au canal. Cela ne prouve pas encore chaque octet sorti, mais établit une exposition hautement probable à investiguer.",
        transfer: "Distinguez toujours accès, exposition probable et exfiltration confirmée. Documenter le niveau de certitude rend votre rapport défendable.",
      }),
      makeStep(steps[4], {
        title: "Choisir un confinement forensique",
        mindset: "La vitesse compte, mais éteindre ou supprimer peut détruire la seule copie de la mémoire, des sockets et du processus malveillant.",
        hypothesis: "Il faut couper le poste et le domaine du réseau tout en gelant l’état utile à l’analyse.",
        actions: [
          action("Comparer chaque option à deux critères", "Pour chaque proposition, demandez : coupe-t-elle le canal maintenant ? préserve-t-elle mémoire et journaux ?", undefined, "Une seule option satisfait les deux critères et réduit aussi le risque pour le reste du parc."),
          action("Préparer la suite", "Après l’isolation, prévoyez l’acquisition mémoire, la sauvegarde des journaux, l’analyse du script et la recherche du domaine sur tout le parc.", undefined, "Le confinement devient le début d’une enquête mesurable, pas une simple suppression du symptôme."),
        ],
        proof: "L’isolation de l’hôte coupe le canal ; le blocage DNS protège les autres actifs ; la préservation permet de déterminer la portée et le vecteur initial.",
        transfer: "En réponse à incident, choisissez l’action qui réduit immédiatement la capacité de l’attaquant avec le moins de perte de preuve possible.",
      }),
    ],
  };
}

function phishingTutorial(item: PracticalInput): LabTutorial {
  return socialTutorial(item, "Le message imite une autorité légitime et combine urgence, confidentialité et pression financière. L’identité affichée n’est qu’une affirmation ; les en-têtes et la procédure interne sont les preuves.", [
    "Ouvrez l’email et cliquez sur « Afficher les en-têtes techniques ».",
    "Comparez From, Reply-To, Return-Path, SPF et DKIM au domaine officiel.",
    "Ouvrez ensuite l’annuaire interne et lisez la procédure PSSI-04 avant de choisir une action.",
  ]);
}

function otpTutorial(item: PracticalInput): LabTutorial {
  return socialTutorial(item, "Deux messages racontent des histoires incompatibles : le service dit que le code ouvre votre compte et interdit de le partager ; un contact vous demande de le lui transmettre. L’attaquant compte sur la confiance et l’urgence pour vous faire ignorer la source primaire.", [
    "Lisez d’abord le SMS du service, sans tenir compte de la demande de Camille.",
    "Identifiez à quel compte le code est rattaché et l’instruction explicite du service.",
    "Comparez ensuite avec le message du contact, puis vérifiez la personne par un autre canal.",
  ]);
}

function socialTutorial(item: PracticalInput, problem: string, inspection: string[]): LabTutorial {
  const steps = ordered(item.steps);
  return {
    problem,
    stakes: "L’ingénierie sociale cherche à déclencher une action avant la vérification. Le bon analyste ralentit la décision, revient à la source primaire et utilise un canal indépendant.",
    mission: "Distinguer identité déclarée et identité prouvée, repérer les leviers psychologiques, puis appliquer une procédure de vérification hors canal.",
    mentalModel: [
      "Une identité affichée, un nom connu ou un ton crédible ne prouvent pas l’expéditeur.",
      "L’urgence et le secret sont des contraintes imposées par l’attaquant pour empêcher la vérification.",
      "La source primaire—SMS du service, en-têtes, annuaire, procédure—prime sur le récit du message.",
      "Vérifiez toujours par un canal que le demandeur suspect ne contrôle pas.",
    ],
    preparation: inspection.map((instruction, index) => action(`Inspection ${index + 1}`, instruction)),
    steps: steps.map((step, index) => makeStep(step, {
      title: index === steps.length - 1 ? "Prendre une décision vérifiable" : `Établir le fait ${index + 1}`,
      mindset: step.hint ?? "Revenez au contenu réellement observable et écartez les suppositions induites par le récit.",
      hypothesis: `La réponse doit être démontrable à partir des pièces, sans faire confiance à l’identité ou à l’urgence affichée.`,
      actions: [
        action("Relire la question", "Identifiez exactement le fait demandé : un en-tête, une destination réelle, un levier psychologique ou une action de réponse."),
        action("Pointer la pièce primaire", index === steps.length - 1 ? "Comparez chaque option à la règle de vérification hors canal et à la procédure interne." : "Recherchez la ligne ou l’instruction qui prouve directement ce fait dans les pièces affichées.", undefined, step.hint ?? undefined),
        action("Tester une interprétation adverse", "Demandez-vous comment un attaquant pourrait falsifier l’élément visible et quelle donnée technique ou procédure resterait indépendante."),
      ],
      proof: step.reveal ?? "La conclusion est retenue parce qu’elle est soutenue par une pièce indépendante, pas parce qu’elle semble plausible.",
      transfer: index === steps.length - 1 ? "Face à une demande urgente, sortez du canal, contactez la personne via l’annuaire et appliquez la procédure même si le demandeur prétend être dirigeant." : "Pour chaque signal social, cherchez son équivalent technique ou procédural vérifiable.",
    })),
  };
}

function genericPracticalTutorial(item: PracticalInput): LabTutorial {
  const webos = item.artifacts.some((artifact) => artifact.kind === "webos");
  return {
    problem: `${item.summary} Le but du tutoriel n’est pas de deviner la réponse, mais de transformer les pièces disponibles en une conclusion vérifiable.`,
    stakes: "Une conclusion sans trace de raisonnement est difficile à reproduire et à défendre. Chaque réponse doit citer une observation et, si possible, une seconde source de confirmation.",
    mission: item.setting,
    mentalModel: CORE_MINDSET,
    preparation: webos ? WEBOS_PREPARATION : [
      action("Lire le scénario", "Reformulez le problème avec vos mots et notez ce qui est connu, inconnu et supposé."),
      action("Inventorier les pièces", `Repérez les artefacts disponibles : ${item.artifacts.map((artifact) => artifact.label).join(" · ") || "aucune pièce nommée"}.`),
      action("Choisir une première hypothèse", "Commencez par l’explication la plus directement testable, puis cherchez ce qui pourrait la réfuter."),
    ],
    steps: ordered(item.steps).map((step, index) => makeStep(step, {
      title: `Construire la preuve ${index + 1}`,
      mindset: step.hint ?? "Cherchez d’abord la source qui peut répondre directement à la question.",
      hypothesis: "Une conclusion correcte doit pouvoir être reliée à une ligne, un champ, un événement ou une règle précise.",
      actions: [
        action("Identifier la bonne pièce", "Associez les mots de la question au journal, fichier, message ou tableau qui contient ce type d’information."),
        action("Réduire le bruit", webos ? "Dans Terminal, utilisez d’abord ls, puis cat pour lire ou grep avec le mot-clé le plus distinctif de la question." : "Filtrez visuellement la pièce sur le champ ou le mot-clé distinctif.", webos ? "ls\n# puis : grep \"mot-clé\" nom-du-fichier" : undefined, step.hint ?? undefined),
        action("Corroborer", "Cherchez une deuxième observation qui confirme l’identité, l’heure, l’action ou la conséquence trouvée."),
      ],
      proof: step.reveal ?? "La réponse est acceptable lorsqu’elle est soutenue par la pièce et cohérente avec la chronologie.",
      transfer: "Conservez ce cycle pour les prochains incidents : question → hypothèse → requête → observation → corroboration → conclusion.",
    })),
  };
}

export function buildChallengeTutorial(item: ChallengeInput): LabTutorial {
  const specific = CHALLENGE_BUILDERS[item.slug];
  return specific ? specific(item) : genericChallengeTutorial(item);
}

const CHALLENGE_BUILDERS: Record<string, (item: ChallengeInput) => LabTutorial> = {
  "message-intercepte": (item) => challengeTutorial(item, {
    problem: "La chaîne ressemble à du texte illisible, mais son alphabet limité, sa longueur et le signe = final indiquent un encodage Base64. L’encodage transforme une représentation ; il ne protège pas un secret.",
    hypothesis: "Si la donnée est du Base64 valide, un décodeur standard doit produire immédiatement un texte lisible et peut-être déjà un flag complet.",
    commands: ["printf '%s' 'SENMe2I0czNfczBpeDRudDNfcXU0dHIzfQ==' | base64 -d", "# Alternative Python\npython3 -c \"import base64; print(base64.b64decode('SENMe2I0czNfczBpeDRudDNfcXU0dHIzfQ==').decode())\""],
    observation: "La sortie commence par le préfixe HCL{ et se termine par }. Aucune opération cryptographique ni clé n’est nécessaire.",
    transfer: "Avant de chercher un chiffrement, reconnaissez les signatures d’encodage : alphabet, padding, longueur et contexte de transport.",
  }),
  "rotation-suspecte": (item) => challengeTutorial(item, {
    problem: "Les caractères restent des lettres et la structure ressemble déjà à un flag. L’indice « 13 positions » désigne ROT13, une substitution symétrique : l’appliquer une seconde fois restitue le texte.",
    hypothesis: "Si c’est bien ROT13, ponctuation et chiffres resteront identiques tandis que chaque lettre tournera de 13 positions.",
    commands: ["printf '%s' 'UPY{p3f4e_a_3fg_c4f_ha_puvsse3z3ag}' | tr 'A-Za-z' 'N-ZA-Mn-za-m'", "# Alternative Python\npython3 -c \"import codecs; print(codecs.decode('UPY{p3f4e_a_3fg_c4f_ha_puvsse3z3ag}', 'rot_13'))\""],
    observation: "Le préfixe devient HCL et le contenu devient une phrase lisible. Cette cohérence valide la transformation.",
    transfer: "Une transformation réversible sans clé n’est pas une protection. Reconnaissez ROT13 par l’indice 13 et par la conservation de la forme du message.",
  }),
  "en-tete-bavard": (item) => challengeTutorial(item, {
    problem: "La réponse HTTP divulgue plusieurs technologies. La question ne demande pas le serveur web, mais l’interpréteur qui exécute le code applicatif.",
    hypothesis: "Server identifie nginx ; X-Powered-By identifie la plateforme applicative et sa version. C’est donc ce second en-tête qu’il faut extraire.",
    commands: [],
    observation: "La valeur de X-Powered-By contient le produit et sa version complète. Le flag doit reprendre exactement cette valeur, sans le nom de l’en-tête.",
    transfer: "Lisez un en-tête comme paire nom/valeur et reliez chaque technologie à sa couche : serveur frontal, runtime applicatif, framework ou proxy.",
  }),
  "force-brute-nocturne": (item) => challengeTutorial(item, {
    problem: "Beaucoup d’échecs attirent l’œil, mais la compromission est prouvée par l’unique succès. Il faut identifier sa source, puis vérifier que cette source apparaît bien dans la séquence d’échecs.",
    hypothesis: "L’adresse portée par Accepted password est l’indicateur décisif ; les lignes Failed précédentes donnent le contexte de force brute.",
    commands: ["grep \"Accepted\" auth.log", "# Puis remplacez ADRESSE par l’IP trouvée\ngrep \"ADRESSE\" auth.log"],
    observation: "Une seule source obtient un succès après plusieurs échecs. Les autres adresses n’ont jamais franchi l’authentification.",
    transfer: "Dans des logs volumineux, filtrez d’abord l’événement qui change l’état du système—succès, création, élévation—puis remontez son contexte.",
  }),
  "empreinte-obsolete": (item) => challengeTutorial(item, {
    problem: "Le challenge demande d’identifier une famille de hash par sa forme, pas de casser le mot de passe. L’empreinte comporte 40 caractères hexadécimaux, donc 160 bits.",
    hypothesis: "Une sortie hexadécimale de 160 bits correspond classiquement à SHA-1 ; la longueur permet de la distinguer de MD5 (32) et SHA-256 (64).",
    commands: ["printf '%s' '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8' | wc -c", "python3 -c \"print(len('5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8'))\""],
    observation: "La longueur renvoyée est 40. Chaque caractère hexadécimal représente 4 bits : 40 × 4 = 160 bits.",
    transfer: "Reconnaissez les hashes par longueur et alphabet, mais ne confondez pas identification et sécurité : pour les mots de passe, utilisez des fonctions lentes et salées comme Argon2id ou bcrypt.",
  }),
  "requete-encodee": (item) => challengeTutorial(item, {
    problem: "Le paramètre id est encodé pour le transport dans une URL. Les séquences %xx ne rendent pas la charge sûre : elles masquent seulement les caractères spéciaux à une lecture rapide.",
    hypothesis: "Après décodage URL, %27 devient une apostrophe, %20 une espace et %3D un signe égal ; la structure logique de l’injection devient visible.",
    commands: ["python3 -c \"from urllib.parse import unquote; print(unquote('1%27%20OR%20%271%27%3D%271'))\""],
    observation: "La sortie forme une condition OR toujours vraie. Il faut placer cette charge décodée, exactement et sans l’altérer, à l’intérieur de HCL{...}.",
    transfer: "Normalisez et décodez les entrées avant de les analyser. Les journaux, WAF et applications doivent comparer la forme canonique, pas seulement la chaîne encodée.",
  }),
};

function challengeTutorial(item: ChallengeInput, details: { problem: string; hypothesis: string; commands: string[]; observation: string; transfer: string }): LabTutorial {
  const executeActions: TutorialAction[] = details.commands.length > 0
    ? details.commands.map((command, index) => action(index === 0 ? "Exécuter la vérification" : "Méthode alternative", index === 0 ? "Ouvrez un terminal de travail et exécutez la commande sans modifier la donnée source." : "Utilisez cette variante si le premier outil n’est pas disponible.", command, details.observation))
    : [action("Lire par couches", "Associez chaque ligne ou champ à son rôle technique, puis isolez uniquement la valeur demandée.", undefined, details.observation)];

  return {
    problem: details.problem,
    stakes: "L’objectif n’est pas de deviner un flag. Vous devez être capable d’expliquer pourquoi la technique choisie s’applique, de reproduire la transformation et de contrôler le format final.",
    mission: item.brief,
    mentalModel: [
      "Commencez par classer la donnée : log, en-tête, hash, encodage ou charge applicative.",
      "Cherchez les signatures structurelles avant de choisir un outil : alphabet, longueur, séparateurs et mots-clés.",
      "Utilisez l’outil le plus simple qui teste votre hypothèse et conservez la donnée originale intacte.",
      "Validez la sortie par le sens et par le format attendu ; une commande qui s’exécute n’est pas automatiquement une preuve.",
    ],
    preparation: [
      action("Définir la question", item.summary),
      action("Extraire les contraintes", "Repérez le format HCL{...}, la casse demandée et ce qui doit être soumis : valeur, nom d’algorithme, adresse ou texte décodé."),
      action("Noter l’indice sans le traiter comme une réponse", item.hint ?? "Aucun indice supplémentaire : appuyez-vous sur la structure de la donnée."),
    ],
    steps: [
      {
        title: "Reconnaître la technique",
        question: "Quelle propriété observable réduit le nombre d’hypothèses ?",
        mindset: "Un bon analyste reconnaît d’abord la famille du problème avant de lancer des outils au hasard.",
        hypothesis: details.hypothesis,
        actions: [action("Inspecter la forme", "Comptez ou comparez les caractères, repérez les marqueurs et reliez-les à l’indice du brief.", undefined, item.hint ?? undefined)],
        proof: "L’hypothèse choisie explique à la fois la forme de la donnée et l’indice. Elle peut maintenant être testée de manière reproductible.",
        transfer: details.transfer,
      },
      {
        title: "Tester l’hypothèse",
        question: "Quelle manipulation minimale transforme l’hypothèse en observation ?",
        mindset: "Une commande sert à produire une preuve. Vous devez savoir ce qu’elle prend en entrée et ce que vous attendez en sortie avant de l’exécuter.",
        hypothesis: details.hypothesis,
        actions: executeActions,
        proof: details.observation,
        transfer: "Gardez une méthode alternative et comparez les sorties lorsque l’enjeu est réel. La reproductibilité réduit les erreurs d’outil ou de copier-coller.",
      },
      {
        title: "Valider et formater",
        question: "La sortie répond-elle exactement à la question et au format demandé ?",
        mindset: "Le dernier piège est souvent le format : espaces, casse, préfixe ou accolades. Ne corrigez pas une sortie qui doit être soumise exactement.",
        hypothesis: "La valeur observée est cohérente avec le brief et peut être encapsulée dans le format HCL demandé.",
        actions: [
          action("Contrôler le sens", "Relisez la sortie : est-elle lisible ou techniquement cohérente avec la question ?", undefined, details.observation),
          action("Contrôler le format", "Vérifiez le préfixe, les accolades, la casse et l’absence d’espace ajouté avant la soumission."),
        ],
        proof: "La conclusion est soutenue par une signature reconnue, une transformation reproductible et un contrôle de format.",
        transfer: details.transfer,
        answer: item.flag,
      },
    ],
  };
}

function genericChallengeTutorial(item: ChallengeInput): LabTutorial {
  return challengeTutorial(item, {
    problem: `${item.summary} Le brief contient la donnée brute, la contrainte de sortie et suffisamment d’indices pour choisir une méthode reproductible.`,
    hypothesis: item.hint ?? "La structure de la donnée indique la technique à tester.",
    commands: [],
    observation: "La bonne méthode doit produire une valeur cohérente avec le brief et le format demandé.",
    transfer: "Décomposez toujours un challenge en quatre questions : qu’est-ce que j’observe, quelle technique l’explique, comment la tester, comment valider la sortie ?",
  });
}

function ordered<T extends { order: number }>(steps: T[]) {
  return [...steps].sort((a, b) => a.order - b.order);
}

function action(title: string, instruction: string, command?: string, observe?: string): TutorialAction {
  return { title, instruction, command, observe };
}

function makeStep(step: PracticalStep | undefined, content: Omit<TutorialStep, "question" | "answer">): TutorialStep {
  return {
    ...content,
    question: step?.prompt ?? "Objectif non défini",
    answer: step?.answer,
  };
}
