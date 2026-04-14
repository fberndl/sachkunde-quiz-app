export const IMAGES = {
  karten_lesen:           require('../assets/images/karten_lesen.jpg'),
  plaene_lesen:           require('../assets/images/plaene_lesen.jpg'),
  bezirke_wien:           require('../assets/images/bezirke_wien.jpg'),
  bezirke_bauwerke:       require('../assets/images/bezirke_bauwerke.jpg'),
  erster_bezirk:          require('../assets/images/erster_bezirk.jpg'),
  erster_bezirk_plaetze:  require('../assets/images/erster_bezirk_plaetze.jpg'),
  ringstrasse:            require('../assets/images/ringstrasse.jpg'),
  ringstrasse_gebaeude:   require('../assets/images/ringstrasse_gebaeude.jpg'),
  ringstrasse_liste:      require('../assets/images/ringstrasse_liste.jpg'),
  ringstrasse_karte:      require('../assets/images/ringstrasse_karte.jpg'),
  ringstrasse_fotos:      require('../assets/images/ringstrasse_fotos.jpg'),
  stephansdom:            require('../assets/images/stephansdom.jpg'),
  stephansdom_innen:      require('../assets/images/stephansdom_innen.jpg'),
  stephansdom_innen2:     require('../assets/images/stephansdom_innen2.jpg'),
  stephansdom_aussen:     require('../assets/images/stephansdom_aussen.jpg'),
  erster_bezirk_info:     require('../assets/images/erster_bezirk_info.jpg'),
  ringstrasse_sheet:      require('../assets/images/ringstrasse_sheet.jpg'),
  planet_sonnensystem:    require('../assets/images/planet_sonnensystem.jpg'),
  planet_sonne:           require('../assets/images/planet_sonne.jpg'),
  planet_merkur:          require('../assets/images/planet_merkur.jpg'),
  planet_venus:           require('../assets/images/planet_venus.jpg'),
  planet_erde:            require('../assets/images/planet_erde.jpg'),
  planet_mars:            require('../assets/images/planet_mars.jpg'),
  planet_jupiter:         require('../assets/images/planet_jupiter.jpg'),
  planet_saturn:          require('../assets/images/planet_saturn.jpg'),
  planet_uranus:          require('../assets/images/planet_uranus.jpg'),
  planet_neptun:          require('../assets/images/planet_neptun.jpg'),
  planet_mond:            require('../assets/images/planet_mond.jpg'),
  planet_milchstrasse:    require('../assets/images/planet_milchstrasse.jpg'),
};

export const QUESTIONS = [
  // KARTEN LESEN
  { id:1, topic:'Karten lesen', type:'multiple_choice', question:'Was befindet sich auf JEDER Landkarte?', options:['Eine Legende','Ein Foto','Eine Telefonnummer','Ein Stadtplan'], correct:0, explanation:'Auf jeder Landkarte befindet sich eine Legende, in der die Kartenzeichen erklärt sind.' },
  { id:2, topic:'Karten lesen', type:'multiple_choice', question:'Was bedeutet Maßstab 1:10?', options:['1 cm Karte = 10 cm Wirklichkeit','10 cm Karte = 1 cm Wirklichkeit','1 km Karte = 10 km','Karte ist 10x vergrößert'], correct:0, explanation:'1 cm am Plan entspricht 10 cm in der Wirklichkeit.' },
  { id:3, topic:'Karten lesen', type:'multiple_choice', question:'In welchem Planquadrat liegt die Hofburg?', options:['D5','E5','C4','D4'], correct:0, explanation:'Die Hofburg liegt im Planquadrat D5.' },
  { id:4, topic:'Karten lesen', type:'multiple_choice', question:'In welchem Planquadrat liegt das Riesenrad?', options:['E5','D5','C4','E6'], correct:0, explanation:'Das Riesenrad liegt im Planquadrat E5.' },
  { id:5, topic:'Karten lesen', type:'multiple_choice', question:'In welchem Planquadrat liegt das AKH?', options:['D4','E5','C4','D5'], correct:0, explanation:'Das AKH liegt im Planquadrat D4.' },
  { id:6, topic:'Karten lesen', type:'multiple_choice', question:'In welchem Planquadrat liegt das Belvedere?', options:['E6','D5','C4','E5'], correct:0, explanation:'Das Belvedere liegt im Planquadrat E6.' },
  { id:7, topic:'Karten lesen', type:'multiple_choice', question:'Womit helfen Planquadrate?', options:['Orte, Berge oder Straßen leichter finden','Entfernung messen','Höhe bestimmen','Wetter vorhersagen'], correct:0, explanation:'Planquadrate helfen, Orte, Berge oder Straßen leichter zu finden.' },
  { id:8, topic:'Karten lesen', type:'fill_blank', question:'Karten und Pläne sind in Kästchen unterteilt, die mit ___ und Buchstaben beschriftet sind.', blanks:['Zahlen'], hint:'Man zählt sie: 1, 2, 3...' },

  // PLAENE LESEN
  { id:10, topic:'Pläne lesen', type:'multiple_choice', image:'plaene_lesen', imageHint:'Schau auf den Stadtplan und nutze die Himmelsrichtungen.', question:'Welche Gebäude liegen NÖRDLICH des Teiches?', options:['Kino und Museum','Kirche und Schule','Markt und Schwimmbad','Rathaus und Schule'], correct:0, explanation:'Nördlich des Teiches liegen das Kino und das Museum.' },
  { id:11, topic:'Pläne lesen', type:'multiple_choice', image:'plaene_lesen', imageHint:'Schau auf den Stadtplan - wo ist Osten?', question:'Welches Gebäude liegt ÖSTLICH des Marktes?', options:['Die Kirche','Das Museum','Das Schwimmbad','Die Schule'], correct:0, explanation:'Östlich des Marktes liegt die Kirche.' },
  { id:12, topic:'Pläne lesen', type:'multiple_choice', image:'plaene_lesen', imageHint:'Schau auf den Stadtplan - wo ist Süden?', question:'Welche Sportart kann man SÜDLICH des Schwimmbads betreiben?', options:['Fußball spielen','Tennis','Basketball','Schwimmen'], correct:0, explanation:'Südlich des Schwimmbads kann man Fußball spielen.' },
  { id:13, topic:'Pläne lesen', type:'multiple_choice', question:'Wohin zeigt bei den meisten Plänen der obere Rand?', options:['Nach Norden','Nach Süden','Nach Osten','Nach Westen'], correct:0, explanation:'Bei den meisten Plänen zeigt der obere Rand nach Norden.' },
  { id:14, topic:'Pläne lesen', type:'fill_blank', question:'Pläne zeigen ein ___, vereinfachtes Bild der Wirklichkeit.', blanks:['verkleinertes'], hint:'Es ist kleiner als die Wirklichkeit.' },

  // BEZIRKE WIENS
  { id:20, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie viele Bezirke hat Wien heute?', options:['23','20','9','12'], correct:0, explanation:'Wien hat heute 23 Bezirke.' },
  { id:21, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Bezirke heißen Innenbezirke?', options:['Bezirke 1 bis 9','Bezirke 1 bis 5','Bezirke 10 bis 23','Bezirke 1 bis 12'], correct:0, explanation:'Die Bezirke 1 bis 9 werden Innenbezirke genannt.' },
  { id:22, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 10. Bezirk?', options:['Favoriten','Simmering','Meidling','Hietzing'], correct:0, explanation:'Der 10. Bezirk heißt Favoriten.' },
  { id:23, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Bezirke werden Inselbezirke genannt?', options:['2 und 20','1 und 9','10 und 11','3 und 4'], correct:0, explanation:'Bezirke 2 und 20 sind von Donau und Donaukanal umschlossen.' },
  { id:24, topic:'Bezirke Wiens', type:'fill_blank', question:'Wien hat heute ___ Bezirke.', blanks:['23'], hint:'Zwischen 20 und 25.' },
  { id:25, topic:'Bezirke Wiens', type:'fill_blank', question:'Die Bezirke 1 bis 9 heißen ___.', blanks:['Innenbezirke'], hint:'Sie liegen im Inneren der Stadt.' },
  { id:26, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 1. Bezirk?', options:['Innere Stadt','Leopoldstadt','Landstraße','Wieden'], correct:0, explanation:'Der 1. Bezirk heißt Innere Stadt.' },
  { id:27, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 6. Bezirk?', options:['Mariahilf','Neubau','Josefstadt','Alsergrund'], correct:0, explanation:'Der 6. Bezirk heißt Mariahilf.' },
  { id:28, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 9. Bezirk?', options:['Alsergrund','Josefstadt','Neubau','Mariahilf'], correct:0, explanation:'Der 9. Bezirk heißt Alsergrund.' },
  { id:29, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 3. Bezirk?', options:['Landstraße','Wieden','Margareten','Mariahilf'], correct:0, explanation:'Der 3. Bezirk heißt Landstraße.' },

  // BEZIRKE BAUWERKE
  { id:30, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk liegt die Votivkirche?', options:['9. Bezirk (Alsergrund)','1. Bezirk (Innere Stadt)','7. Bezirk (Neubau)','3. Bezirk'], correct:0, explanation:'Die Votivkirche liegt im 9. Bezirk - Alsergrund.' },
  { id:31, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk liegt das Schloss Belvedere?', options:['3. Bezirk (Landstrasse)','4. Bezirk (Wieden)','13. Bezirk (Hietzing)','1. Bezirk'], correct:0, explanation:'Das Schloss Belvedere liegt im 3. Bezirk - Landstrasse.' },
  { id:32, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk liegt der DC Tower 1?', options:['22. Bezirk (Donaustadt)','1. Bezirk','20. Bezirk (Brigittenau)','10. Bezirk'], correct:0, explanation:'Der DC Tower 1 liegt im 22. Bezirk - Donaustadt.' },
  { id:33, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk liegt das Haus des Meeres?', options:['6. Bezirk (Mariahilf)','7. Bezirk (Neubau)','5. Bezirk (Margareten)','8. Bezirk'], correct:0, explanation:'Das Haus des Meeres liegt im 6. Bezirk - Mariahilf.' },

  // 1. BEZIRK
  { id:40, topic:'1. Bezirk', type:'multiple_choice', question:'Was ist der 1. Bezirk?', options:['Der älteste Teil Wiens','Der größte Bezirk','Der neueste Bezirk','Der bevölkerungsreichste'], correct:0, explanation:'Der 1. Bezirk ist der älteste Teil Wiens - seine Anfänge reichen bis zu einer keltischen Siedlung zurück.' },
  { id:41, topic:'1. Bezirk', type:'multiple_choice', question:'Welches Bauwerk ist die Pestsäule?', options:['Die verzierte Barocksäule auf dem Graben','Der Turm mit der Glocke','Der Brunnen am Stephansplatz','Das Tor der Stadtmauer'], correct:0, explanation:'Die Pestsäule ist eine vergoldete Barocksäule auf dem Graben im 1. Bezirk.' },
  { id:42, topic:'1. Bezirk', type:'multiple_choice', question:'Womit war der 1. Bezirk früher zum Schutz umgeben?', options:['Einer Stadtmauer und einem Graben','Einem Fluss','Einem Wald','Einer Mauer ohne Graben'], correct:0, explanation:'Der 1. Bezirk war von einer Stadtmauer umgeben, vor der ein Graben verlief.' },
  { id:43, topic:'1. Bezirk', type:'fill_blank', question:'Der 1. Bezirk ist der ___ Teil Wiens.', blanks:['älteste'], hint:'Er wurde zuerst gegründet.' },
  { id:44, topic:'1. Bezirk', type:'multiple_choice', question:'Auf welchem Platz steht das Haas Haus?', options:['Stock-im-Eisen-Platz','Michaelerplatz','Albertinaplatz','Hoher Markt'], correct:0, explanation:'Das Haas Haus steht am Stock-im-Eisen-Platz gegenüber dem Stephansdom.' },
  { id:45, topic:'1. Bezirk', type:'multiple_choice', question:'Was steht auf dem Albertinaplatz?', options:['Denkmal des Erzherzogs Albrecht','Der Donaunixenbrunnen','Die Pestsäule','Die Ankeruhr'], correct:0, explanation:'Auf dem Albertinaplatz steht das Reiterstandbild des Erzherzogs Albrecht.' },
  { id:46, topic:'1. Bezirk', type:'multiple_choice', question:'Was befindet sich auf dem Hohen Markt?', options:['Die Ankeruhr','Der Donaunixenbrunnen','Die Pestsäule','Das Haas Haus'], correct:0, explanation:'Auf dem Hohen Markt befindet sich die Ankeruhr (Jugendstil, 1914).' },
  { id:47, topic:'1. Bezirk', type:'multiple_choice', question:'Wie viele Museen hat der 1. Bezirk?', options:['Mehr als 60','Mehr als 10','Mehr als 30','Mehr als 100'], correct:0, explanation:'Der 1. Bezirk hat mit mehr als 60 Museen die meisten in ganz Wien.' },
  { id:48, topic:'1. Bezirk', type:'multiple_choice', question:'Was ist die Ruprechtskirche?', options:['Die älteste Kirche Wiens','Die größte','Die bekannteste','Die neueste'], correct:0, explanation:'Die Ruprechtskirche ist die älteste Kirche Wiens.' },

  // RINGSTRASSE
  { id:50, topic:'Ringstraße', type:'multiple_choice', question:'Wer ließ die Ringstrasse bauen?', options:['Kaiser Franz Joseph I.','Kaiser Karl I.','Kaiserin Maria Theresia','Kaiser Leopold'], correct:0, explanation:'Vor etwa 170 Jahren ließ Kaiser Franz Joseph I. die Stadtmauer niederreißen und die Ringstrasse anlegen.' },
  { id:51, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt die Staatsoper?', options:['Opernring','Burgring','Schubertring','Kärntner Ring'], correct:0, explanation:'Die Staatsoper liegt am Opernring.' },
  { id:52, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt das Burgtheater?', options:['Universitätsring','Schottenring','Burgring','Dr.-Karl-Renner-Ring'], correct:0, explanation:'Das Burgtheater liegt am Universitätsring.' },
  { id:53, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt das Naturhistorische Museum?', options:['Burgring','Opernring','Universitätsring','Schubertring'], correct:0, explanation:'Das Naturhistorische Museum liegt am Burgring.' },
  { id:54, topic:'Ringstraße', type:'multiple_choice', question:'Wie lang ist die Ringstrasse?', options:['4 km','2 km','10 km','57 m'], correct:0, explanation:'Die Ringstrasse ist 4 km lang und 57 m breit.' },
  { id:55, topic:'Ringstraße', type:'multiple_choice', question:'Wie breit ist die Ringstrasse?', options:['57 m','4 m','100 m','27 m'], correct:0, explanation:'Die Ringstrasse ist 57 m breit.' },
  { id:56, topic:'Ringstraße', type:'fill_blank', question:'Die Ringstrasse ist ___ km lang.', blanks:['4'], hint:'Eine einstellige Zahl.' },
  { id:57, topic:'Ringstraße', type:'multiple_choice', question:'Aus wie vielen Abschnitten besteht die Ringstrasse?', options:['10','8','12','6'], correct:0, explanation:'Die Ringstrasse besteht aus 10 Abschnitten.' },

  // RINGSTRASSE GEBAEUDE
  { id:60, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wo studieren viele junge Menschen?', options:['Universität','Parlament','Museum','Rathaus'], correct:0, explanation:'In der Universität Wien studieren rund 90.000 junge Menschen.' },
  { id:61, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wo werden Gesetze für ganz Österreich beschlossen?', options:['Im Parlament','Im Rathaus','In der Hofburg','In der Universität'], correct:0, explanation:'Im Parlament werden Gesetze für ganz Österreich besprochen und beschlossen.' },
  { id:62, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wo sind wertvolle Gegenstände und Bilder ausgestellt?', options:['Im Kunsthistorischen Museum','Im Parlament','Im Rathaus','In der Universität'], correct:0, explanation:'Im Kunsthistorischen Museum sind Gemälde, Statuen und Mumien zu sehen.' },
  { id:63, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wo ist der Sitz der Nationalbibliothek und des Bundespräsidenten?', options:['In der Hofburg','Im Rathaus','Im Parlament','Im Burgtheater'], correct:0, explanation:'Die Hofburg ist Amtssitz des Bundespräsidenten und beherbergt die Nationalbibliothek.' },
  { id:64, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wo arbeitet der Bürgermeister von Wien?', options:['Im Rathaus','Im Parlament','In der Hofburg','Im Burgtheater'], correct:0, explanation:'Das Rathaus ist Sitz der Verwaltung der Stadt Wien und Amtssitz des Bürgermeisters.' },
  { id:65, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Was war der erste "Wolkenkratzer" Wiens?', options:['Der Ringturm','Der DC Tower','Die Staatsoper','Das Burgtheater'], correct:0, explanation:'Der Ringturm ist ein Bürogebäude mit Wetteranzeige - er war der erste Wolkenkratzer Wiens.' },
  { id:66, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Was steht vor dem Parlament?', options:['Pallas-Athene-Brunnen','Donaunixenbrunnen','Reiterstatue','Pestsäule'], correct:0, explanation:'Vor dem Parlament steht der Pallas-Athene-Brunnen.' },
  { id:67, topic:'Ringstraße Gebäude', type:'fill_blank', question:'Das ___ ist das größte deutschsprachige Sprechtheater.', blanks:['Burgtheater'], hint:'Es liegt am Universitätsring.' },
  { id:68, topic:'Ringstraße Gebäude', type:'fill_blank', question:'Die Wiener Staatsoper war der ___ Ringstraßenbau.', blanks:['erste'], hint:'Sie wurde als erstes gebaut.' },

  // STEPHANSDOM
  { id:70, topic:'Stephansdom', type:'multiple_choice', question:'Wie hoch ist der SÜDTURM des Stephansdoms?', options:['137 m','68 m','100 m','200 m'], correct:0, explanation:'Der Südturm ist 136,70 m - also circa 137 m - hoch.' },
  { id:71, topic:'Stephansdom', type:'multiple_choice', question:'Wie hoch ist der NORDTURM (mit der Pummerin)?', options:['68 m','137 m','100 m','50 m'], correct:0, explanation:'Der Nordturm ist 68 m hoch. In ihm hängt die Pummerin.' },
  { id:72, topic:'Stephansdom', type:'multiple_choice', question:'Was passierte mit dem Dom im 2. Weltkrieg?', options:['Fast zur Gänze zerstört','Blieb unberührt','Leicht beschädigt','Komplett abgerissen'], correct:0, explanation:'Der Dom wurde im 2. Weltkrieg beinahe zur Gänze zerstört und danach wieder aufgebaut.' },
  { id:73, topic:'Stephansdom', type:'multiple_choice', question:'Wie viele Stufen führen in die Türmerstube des Südturms?', options:['343 Stufen','200 Stufen','500 Stufen','137 Stufen'], correct:0, explanation:'Zur Türmerstube führen 343 Stufen hinauf.' },
  { id:74, topic:'Stephansdom', type:'multiple_choice', question:'Warum heißt der Nordturm auch ADLERTURM?', options:['Ein Steinadler sitzt auf der Turmspitze','Adler nisten dort','Form eines Adlers','Nach Kaiser Adler'], correct:0, explanation:'Der Nordturm heißt Adlerturm, weil sich ein Steinadler auf der Turmspitze befindet.' },
  { id:75, topic:'Stephansdom', type:'multiple_choice', question:'Was ist das Riesentor?', options:['Der Haupteingang des Stephansdoms','Das größte Tor der Stadtmauer','Ein Stadttor im 1. Bezirk','Der Name des Südturms'], correct:0, explanation:'Das romanische Riesentor ist der Haupteingang des Stephansdoms.' },
  { id:76, topic:'Stephansdom', type:'multiple_choice', question:'Was ist die PUMMERIN?', options:['Die größte Glocke Wiens','Ein Turm des Doms','Eine Statue','Eine Orgel'], correct:0, explanation:'Die Pummerin ist die größte Glocke Wiens und hängt im Nordturm.' },
  { id:77, topic:'Stephansdom', type:'multiple_choice', question:'Was sind die Rosettenfenster?', options:['Kreisrunde Zierfenster des Doms','Das größte Fenster','Fenster mit Heiligenbildern','Fenster im Nordturm'], correct:0, explanation:'Kreisrunde Rosettenfenster zieren den Stephansdom.' },
  { id:78, topic:'Stephansdom', type:'multiple_choice', question:'Was ist der Fenstergucker?', options:['Selbstdarstellung von Meister Pilgram','Ein Fenster im Nordturm','Eine Figur am Riesentor','Ein Gargoyle'], correct:0, explanation:'Der Fenstergucker ist die Selbstdarstellung des Baumeisters Meister Pilgram unter der Kanzel.' },
  { id:79, topic:'Stephansdom', type:'multiple_choice', question:'Was stellen die Figuren am Geländer der Domkanzel dar?', options:['Kampf zwischen Gut und Böse','Engel und Teufel','Heilige und Könige','Tiere des Waldes'], correct:0, explanation:'Am Geländer der Domkanzel stellen Frösche und Eidechsen den Kampf zwischen Gut und Böse dar.' },
  { id:80, topic:'Stephansdom', type:'fill_blank', question:'Der Südturm des Stephansdoms ist ___ m hoch.', blanks:['137'], hint:'Zwischen 130 und 140 Meter.' },
  { id:81, topic:'Stephansdom', type:'fill_blank', question:'Die ___ ist die größte Glocke Wiens.', blanks:['Pummerin'], hint:'Ihr Name klingt nach einem lauten Geräusch.' },
  { id:82, topic:'Stephansdom', type:'fill_blank', question:'Das ___ ist der romanische Haupteingang des Stephansdoms.', blanks:['Riesentor'], hint:'Es heißt Riesen... weil es sehr groß ist.' },

  // RINGSTRASSE (weitere Fragen)
  { id:83, topic:'Ringstraße', type:'multiple_choice', question:'Welcher Kai schließt den Ring der Ringstraße?', options:['Franz-Josefs-Kai','Donaukanal-Kai','Stuben-Kai','Schwedenkai'], correct:0, explanation:'Der Franz-Josefs-Kai entlang des Donaukanals schließt den Ring.' },
  { id:84, topic:'Ringstraße', type:'multiple_choice', question:'Was wurde auf beiden Seiten der Ringstraße angelegt?', options:['Alleen (Baumreihen)','Straßenbahnschienen','Parkplätze','Geschäfte'], correct:0, explanation:'Zwischen den Prachtbauten und der Straße wurden auf beiden Seiten Alleen angelegt.' },
  { id:85, topic:'Ringstraße', type:'fill_blank', question:'Die Ringstrasse ist ___ m breit.', blanks:['57'], hint:'Fast 60 Meter.' },
  { id:86, topic:'Ringstraße', type:'multiple_choice', question:'Welcher Park liegt NICHT an der Ringstraße?', options:['Augarten','Stadtpark','Burggarten','Volksgarten'], correct:0, explanation:'Der Augarten liegt im 2. Bezirk. An der Ringstraße liegen: Stadtpark, Burggarten, Volksgarten, Rathauspark und Sigmund-Freud-Park.' },
  { id:87, topic:'Ringstraße', type:'multiple_choice', question:'Was war VORHER dort, wo heute die Ringstraße ist?', options:['Die Stadtmauer','Ein Fluss','Ein Wald','Ein Markt'], correct:0, explanation:'Kaiser Franz Joseph I. ließ die Stadtmauer niederreißen und die Ringstraße anlegen.' },
  { id:88, topic:'Ringstraße', type:'fill_blank', question:'Der Franz-Josefs-Kai verläuft entlang des ___.', blanks:['Donaukanals'], hint:'Ein Kanal der Donau.' },

  // RINGSTRASSE GEBAEUDE (weitere Fragen)
  { id:89, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Welches Denkmal steht im Stadtpark?', options:['Johann-Strauß-Denkmal','Pallas-Athene-Brunnen','Pestsäule','Reiterstandbild'], correct:0, explanation:'Im Stadtpark steht das berühmte Johann-Strauß-Denkmal.' },
  { id:90, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'An welchem Ring liegt das Hotel Imperial?', options:['Kärntner Ring','Opernring','Parkring','Stubenring'], correct:0, explanation:'Das berühmte Hotel Imperial steht am Kärntner Ring.' },
  { id:91, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Was befindet sich am Stubenring?', options:['Regierungsgebäude und MAK','Parlament','Universität','Staatsoper'], correct:0, explanation:'Am Stubenring befinden sich das Regierungsgebäude und das Museum für angewandte Kunst (MAK).' },
  { id:92, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Nach welchem Komponisten ist der Schubertring benannt?', options:['Franz Schubert','Johann Strauss','Mozart','Beethoven'], correct:0, explanation:'Der Schubertring ist nach dem Komponisten Franz Schubert benannt.' },
  { id:93, topic:'Ringstraße Gebäude', type:'fill_blank', question:'Am Burgring stehen die Hofburg und das Natur- und ___ Museum.', blanks:['Kunsthistorisches'], hint:'Dort gibt es Gemälde und Statuen.' },
  { id:94, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wie viele Abschnitte hat die Ringstraße (ohne Franz-Josefs-Kai)?', options:['9','10','8','12'], correct:0, explanation:'Die Ringstraße hat 9 Abschnitte. Zählt man den Franz-Josefs-Kai dazu, sind es 10.' },

  // BEZIRKE WIENS (weitere Fragen)
  { id:95, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk steht das Riesenrad im Prater?', options:['2. Bezirk - Leopoldstadt','1. Bezirk - Innere Stadt','22. Bezirk - Donaustadt','10. Bezirk - Favoriten'], correct:0, explanation:'Das Riesenrad steht im Prater im 2. Bezirk (Leopoldstadt).' },
  { id:96, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk ist das Hundertwasserhaus?', options:['3. Bezirk - Landstraße','1. Bezirk - Innere Stadt','7. Bezirk - Neubau','6. Bezirk - Mariahilf'], correct:0, explanation:'Das bunte Hundertwasserhaus steht im 3. Bezirk (Landstraße).' },
  { id:97, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welcher ist der kleinste Bezirk Wiens?', options:['8. Bezirk - Josefstadt','1. Bezirk - Innere Stadt','4. Bezirk - Wieden','5. Bezirk - Margareten'], correct:0, explanation:'Die Josefstadt (8. Bezirk) ist der kleinste Bezirk Wiens.' },
  { id:98, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welcher Bezirk hat die meisten Einwohner?', options:['10. Bezirk - Favoriten','22. Bezirk - Donaustadt','21. Bezirk - Floridsdorf','2. Bezirk - Leopoldstadt'], correct:0, explanation:'Favoriten (10. Bezirk) hat die höchste Einwohnerzahl aller Wiener Bezirke.' },
  { id:99, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welcher ist der flächenmäßig größte Bezirk?', options:['22. Bezirk - Donaustadt','10. Bezirk - Favoriten','21. Bezirk - Floridsdorf','23. Bezirk - Liesing'], correct:0, explanation:'Die Donaustadt (22. Bezirk) ist flächenmäßig der größte Bezirk Wiens.' },
  { id:100, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk ist der berühmte Naschmarkt?', options:['6. Bezirk - Mariahilf','4. Bezirk - Wieden','1. Bezirk - Innere Stadt','7. Bezirk - Neubau'], correct:0, explanation:'Der berühmte Naschmarkt liegt im 6. Bezirk (Mariahilf).' },
  { id:101, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wo steht Schloss Schönbrunn?', options:['13. Bezirk - Hietzing','1. Bezirk - Innere Stadt','14. Bezirk - Penzing','19. Bezirk - Döbling'], correct:0, explanation:'Schloss Schönbrunn und der Tiergarten liegen im 13. Bezirk (Hietzing).' },
  { id:102, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk ist der Zentralfriedhof?', options:['11. Bezirk - Simmering','10. Bezirk - Favoriten','23. Bezirk - Liesing','3. Bezirk - Landstraße'], correct:0, explanation:'Der Zentralfriedhof, der größte Friedhof Wiens, liegt im 11. Bezirk (Simmering).' },
  { id:103, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wo befindet sich das AKH (Allgemeines Krankenhaus)?', options:['9. Bezirk - Alsergrund','1. Bezirk - Innere Stadt','18. Bezirk - Währing','8. Bezirk - Josefstadt'], correct:0, explanation:'Das AKH, eines der größten Krankenhäuser Europas, steht im 9. Bezirk (Alsergrund).' },
  { id:104, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welcher Bezirk ist der jüngste Wiens?', options:['23. Bezirk - Liesing','22. Bezirk - Donaustadt','21. Bezirk - Floridsdorf','10. Bezirk - Favoriten'], correct:0, explanation:'Liesing (23. Bezirk) ist der jüngste Bezirk Wiens.' },
  { id:105, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wo liegt der Donauturm?', options:['22. Bezirk - Donaustadt','2. Bezirk - Leopoldstadt','21. Bezirk - Floridsdorf','20. Bezirk - Brigittenau'], correct:0, explanation:'Der Donauturm steht im 22. Bezirk (Donaustadt) an der Alten Donau.' },
  { id:106, topic:'Bezirke Wiens', type:'multiple_choice', question:'Die Mariahilfer Straße mit vielen Geschäften liegt im...?', options:['7. Bezirk - Neubau','6. Bezirk - Mariahilf','1. Bezirk - Innere Stadt','8. Bezirk - Josefstadt'], correct:0, explanation:'Die Mariahilfer Straße mit vielen Geschäften liegt hauptsächlich im 7. Bezirk (Neubau).' },
  { id:107, topic:'Bezirke Wiens', type:'fill_blank', question:'Der ___ Bezirk (Leopoldstadt) hat den Prater mit dem Riesenrad.', blanks:['2.'], hint:'Eine einstellige Zahl mit Punkt.' },
  { id:108, topic:'Bezirke Wiens', type:'fill_blank', question:'Schloss Schönbrunn liegt im ___. Bezirk.', blanks:['13'], hint:'Hietzing.' },
  { id:109, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welcher Bezirk hat eine eigene Schneekugelmanufaktur?', options:['17. Bezirk - Hernals','16. Bezirk - Ottakring','18. Bezirk - Währing','19. Bezirk - Döbling'], correct:0, explanation:'In Hernals (17. Bezirk) befindet sich die einzige Schneekugelmanufaktur Europas.' },
  { id:110, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wo ist der Westbahnhof?', options:['15. Bezirk - Rudolfsheim-Fünfhaus','7. Bezirk - Neubau','6. Bezirk - Mariahilf','16. Bezirk - Ottakring'], correct:0, explanation:'Der Westbahnhof und die Wiener Stadthalle liegen im 15. Bezirk (Rudolfsheim-Fünfhaus).' },

  // ═══ ALLE 23 BEZIRKE SYSTEMATISCH: Nummer → Name ═══
  { id:200, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 2. Bezirk?', options:['Leopoldstadt','Brigittenau','Landstraße','Innere Stadt'], correct:0, explanation:'Der 2. Bezirk heißt Leopoldstadt. Hier liegt der Prater.' },
  { id:201, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 4. Bezirk?', options:['Wieden','Margareten','Mariahilf','Landstraße'], correct:0, explanation:'Der 4. Bezirk heißt Wieden.' },
  { id:202, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 5. Bezirk?', options:['Margareten','Mariahilf','Wieden','Neubau'], correct:0, explanation:'Der 5. Bezirk heißt Margareten.' },
  { id:203, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 7. Bezirk?', options:['Neubau','Josefstadt','Mariahilf','Alsergrund'], correct:0, explanation:'Der 7. Bezirk heißt Neubau.' },
  { id:204, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 8. Bezirk?', options:['Josefstadt','Neubau','Alsergrund','Währing'], correct:0, explanation:'Der 8. Bezirk heißt Josefstadt - der kleinste Bezirk Wiens.' },
  { id:205, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 11. Bezirk?', options:['Simmering','Favoriten','Meidling','Floridsdorf'], correct:0, explanation:'Der 11. Bezirk heißt Simmering.' },
  { id:206, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 12. Bezirk?', options:['Meidling','Hietzing','Simmering','Penzing'], correct:0, explanation:'Der 12. Bezirk heißt Meidling.' },
  { id:207, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 13. Bezirk?', options:['Hietzing','Penzing','Meidling','Liesing'], correct:0, explanation:'Der 13. Bezirk heißt Hietzing - hier liegt Schloss Schönbrunn.' },
  { id:208, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 14. Bezirk?', options:['Penzing','Hietzing','Ottakring','Hernals'], correct:0, explanation:'Der 14. Bezirk heißt Penzing.' },
  { id:209, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 15. Bezirk?', options:['Rudolfsheim-Fünfhaus','Ottakring','Penzing','Mariahilf'], correct:0, explanation:'Der 15. Bezirk heißt Rudolfsheim-Fünfhaus.' },
  { id:210, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 16. Bezirk?', options:['Ottakring','Hernals','Rudolfsheim-Fünfhaus','Penzing'], correct:0, explanation:'Der 16. Bezirk heißt Ottakring.' },
  { id:211, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 17. Bezirk?', options:['Hernals','Währing','Ottakring','Döbling'], correct:0, explanation:'Der 17. Bezirk heißt Hernals.' },
  { id:212, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 18. Bezirk?', options:['Währing','Döbling','Hernals','Alsergrund'], correct:0, explanation:'Der 18. Bezirk heißt Währing.' },
  { id:213, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 19. Bezirk?', options:['Döbling','Währing','Brigittenau','Floridsdorf'], correct:0, explanation:'Der 19. Bezirk heißt Döbling.' },
  { id:214, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 20. Bezirk?', options:['Brigittenau','Leopoldstadt','Floridsdorf','Döbling'], correct:0, explanation:'Der 20. Bezirk heißt Brigittenau.' },
  { id:215, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 21. Bezirk?', options:['Floridsdorf','Donaustadt','Brigittenau','Liesing'], correct:0, explanation:'Der 21. Bezirk heißt Floridsdorf.' },
  { id:216, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 22. Bezirk?', options:['Donaustadt','Floridsdorf','Liesing','Simmering'], correct:0, explanation:'Der 22. Bezirk heißt Donaustadt - der größte Bezirk Wiens.' },
  { id:217, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie heißt der 23. Bezirk?', options:['Liesing','Donaustadt','Meidling','Hietzing'], correct:0, explanation:'Der 23. Bezirk heißt Liesing.' },

  // ═══ Name → Bezirksnummer ═══
  { id:220, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Leopoldstadt?', options:['2','3','20','1'], correct:0, explanation:'Leopoldstadt ist der 2. Bezirk.' },
  { id:221, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Wieden?', options:['4','5','3','6'], correct:0, explanation:'Wieden ist der 4. Bezirk.' },
  { id:222, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Margareten?', options:['5','4','6','7'], correct:0, explanation:'Margareten ist der 5. Bezirk.' },
  { id:223, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Neubau?', options:['7','8','6','9'], correct:0, explanation:'Neubau ist der 7. Bezirk.' },
  { id:224, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Josefstadt?', options:['8','7','9','6'], correct:0, explanation:'Josefstadt ist der 8. Bezirk.' },
  { id:225, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Favoriten?', options:['10','11','9','12'], correct:0, explanation:'Favoriten ist der 10. Bezirk.' },
  { id:226, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Simmering?', options:['11','10','12','22'], correct:0, explanation:'Simmering ist der 11. Bezirk.' },
  { id:227, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Meidling?', options:['12','11','13','14'], correct:0, explanation:'Meidling ist der 12. Bezirk.' },
  { id:228, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Hietzing?', options:['13','12','14','23'], correct:0, explanation:'Hietzing ist der 13. Bezirk.' },
  { id:229, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Penzing?', options:['14','13','15','16'], correct:0, explanation:'Penzing ist der 14. Bezirk.' },
  { id:230, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Rudolfsheim-Fünfhaus?', options:['15','14','16','6'], correct:0, explanation:'Rudolfsheim-Fünfhaus ist der 15. Bezirk.' },
  { id:231, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Ottakring?', options:['16','15','17','14'], correct:0, explanation:'Ottakring ist der 16. Bezirk.' },
  { id:232, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Hernals?', options:['17','16','18','19'], correct:0, explanation:'Hernals ist der 17. Bezirk.' },
  { id:233, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Währing?', options:['18','17','19','9'], correct:0, explanation:'Währing ist der 18. Bezirk.' },
  { id:234, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Döbling?', options:['19','18','20','21'], correct:0, explanation:'Döbling ist der 19. Bezirk.' },
  { id:235, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Brigittenau?', options:['20','2','21','19'], correct:0, explanation:'Brigittenau ist der 20. Bezirk.' },
  { id:236, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Floridsdorf?', options:['21','22','20','19'], correct:0, explanation:'Floridsdorf ist der 21. Bezirk.' },
  { id:237, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Donaustadt?', options:['22','21','23','20'], correct:0, explanation:'Donaustadt ist der 22. Bezirk.' },
  { id:238, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Nummer hat Liesing?', options:['23','22','21','13'], correct:0, explanation:'Liesing ist der 23. Bezirk.' },

  // ═══ Bezirke Lückentext (alle wichtigen) ═══
  { id:240, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 2. Bezirk heißt ___.', blanks:['Leopoldstadt'], hint:'Beginnt mit L, hier ist der Prater.' },
  { id:241, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 4. Bezirk heißt ___.', blanks:['Wieden'], hint:'Reimt sich auf Frieden.' },
  { id:242, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 5. Bezirk heißt ___.', blanks:['Margareten'], hint:'Ein Frauenname mit M.' },
  { id:243, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 7. Bezirk heißt ___.', blanks:['Neubau'], hint:'Etwas Neues bauen.' },
  { id:244, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 8. Bezirk heißt ___.', blanks:['Josefstadt'], hint:'Ein Männername + Stadt.' },
  { id:245, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 10. Bezirk heißt ___.', blanks:['Favoriten'], hint:'Beginnt mit F, wie Lieblings...' },
  { id:246, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 11. Bezirk heißt ___.', blanks:['Simmering'], hint:'Beginnt mit S.' },
  { id:247, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 12. Bezirk heißt ___.', blanks:['Meidling'], hint:'Beginnt mit M.' },
  { id:248, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 13. Bezirk heißt ___.', blanks:['Hietzing'], hint:'Hier steht Schönbrunn.' },
  { id:249, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 16. Bezirk heißt ___.', blanks:['Ottakring'], hint:'Bekannt für ein Bier.' },
  { id:250, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 19. Bezirk heißt ___.', blanks:['Döbling'], hint:'Beginnt mit D.' },
  { id:251, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 20. Bezirk heißt ___.', blanks:['Brigittenau'], hint:'Beginnt mit B.' },
  { id:252, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 21. Bezirk heißt ___.', blanks:['Floridsdorf'], hint:'Endet mit -dorf.' },
  { id:253, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 22. Bezirk heißt ___.', blanks:['Donaustadt'], hint:'Hat mit der Donau zu tun.' },
  { id:254, topic:'Bezirke Wiens', type:'fill_blank', question:'Der 23. Bezirk heißt ___.', blanks:['Liesing'], hint:'Beginnt mit L, am Stadtrand.' },

  // ═══ Bezirke Lage & Spezialwissen ═══
  { id:260, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Bezirke liegen NÖRDLICH der Donau?', options:['21 und 22','2 und 20','19 und 20','1 und 2'], correct:0, explanation:'Floridsdorf (21) und Donaustadt (22) liegen nördlich der Donau.' },
  { id:261, topic:'Bezirke Wiens', type:'multiple_choice', question:'Was trennt die Innenbezirke von den Außenbezirken?', options:['Der Gürtel','Die Ringstraße','Die Donau','Der Donaukanal'], correct:0, explanation:'Der Gürtel trennt die Innenbezirke (1-9) von den Außenbezirken (10-23).' },
  { id:262, topic:'Bezirke Wiens', type:'fill_blank', question:'Der ___ trennt die Innenbezirke von den Außenbezirken.', blanks:['Gürtel'], hint:'Wie ein Gürtel um die innere Stadt.' },
  { id:263, topic:'Bezirke Wiens', type:'multiple_choice', question:'Welche Bezirke nennt man INSELBEZIRKE?', options:['2 und 20','1 und 9','21 und 22','10 und 11'], correct:0, explanation:'Leopoldstadt (2) und Brigittenau (20) sind von Donau und Donaukanal umschlossen.' },

  // ── STEPHANSDOM (aus Schulbuch S.11-12, S.30) ──
  { id:270, topic:'Stephansdom', type:'multiple_choice', question:'Wie viele farbig glasierte Dachziegel hat der Stephansdom?', options:['230.000','100.000','50.000','500.000'], correct:0, explanation:'Das Dach des Stephansdoms besteht aus 230.000 farbig glasierten Ziegeln.' },
  { id:271, topic:'Stephansdom', type:'multiple_choice', question:'Wie schwer ist die Pummerin?', options:['21.383 kg','10.000 kg','5.000 kg','50.000 kg'], correct:0, explanation:'Die Pummerin wiegt 21.383 kg und ist die größte Glocke Österreichs.' },
  { id:272, topic:'Stephansdom', type:'multiple_choice', question:'Wann läutet die Pummerin?', options:['Nur zu besonderen Anlässen','Jeden Tag um 12 Uhr','Jeden Sonntag','Jede Stunde'], correct:0, explanation:'Die Pummerin läutet nur zu besonderen Anlässen wie Silvester.' },
  { id:273, topic:'Stephansdom', type:'multiple_choice', question:'Was befindet sich neben dem Riesentor am Stephansdom?', options:['Zwei alte Längenmaße (Tuchelle und Leinwandelle)','Zwei Statuen','Zwei Brunnen','Zwei Glocken'], correct:0, explanation:'Rechts vom Riesentor befinden sich zwei alte Längenmaße - die ältesten erhaltenen Maßstäbe Österreichs.' },
  { id:274, topic:'Stephansdom', type:'multiple_choice', question:'Wovon leitet sich die "Elle" als Maßeinheit ab?', options:['Von der Länge eines Unterarms','Von der Länge eines Fußes','Von der Breite einer Hand','Von der Länge eines Schritts'], correct:0, explanation:'Die Elle leitet sich von der Länge eines Unterarms ab.' },
  { id:275, topic:'Stephansdom', type:'multiple_choice', question:'Woher kommt der Name "Heidentürme"?', options:['Von heidnischen (nicht-christlichen) Figuren','Von einer Familie namens Heiden','Von der Heide (Landschaft)','Von einem Heiligen'], correct:0, explanation:'Die Heidentürme heißen so, weil sie an heidnische (nicht-christliche) Gottheiten und Zeichen erinnern.' },
  { id:276, topic:'Stephansdom', type:'multiple_choice', question:'Wie wird der Südturm des Stephansdoms noch genannt?', options:['Steffl','Adlerturm','Heidenturm','Glockenturm'], correct:0, explanation:'Der Südturm wird auch "Steffl" oder "Hoher Turm" genannt.' },
  { id:277, topic:'Stephansdom', type:'multiple_choice', question:'Was ist der Wiener Neustädter Altar?', options:['Ein gotisches Altarwerk von 1447','Ein modernes Gemälde','Eine Statue am Eingang','Ein Fenster im Nordturm'], correct:0, explanation:'Der Wiener Neustädter Altar wurde 1447 auf Befehl Kaiser Friedrichs III. geschaffen - vergoldet und bemalt.' },
  { id:278, topic:'Stephansdom', type:'multiple_choice', question:'Was befindet sich in den Katakomben unter dem Stephansdom?', options:['Gebeine von 11.000 Menschen und Habsburger-Urnen','Ein unterirdischer See','Alte Waffen','Ein Schatz'], correct:0, explanation:'In den Katakomben liegen die Gebeine von etwa 11.000 Menschen sowie Urnen mit Eingeweiden der Habsburger.' },
  { id:279, topic:'Stephansdom', type:'multiple_choice', question:'Aus welchem Jahrhundert stammen die gotischen Glasfenster des Stephansdoms?', options:['14. und 15. Jahrhundert','18. Jahrhundert','20. Jahrhundert','12. Jahrhundert'], correct:0, explanation:'Die gotischen Glasfenster des linken Seitenschiffs stammen aus dem 14. und 15. Jahrhundert.' },
  { id:280, topic:'Stephansdom', type:'fill_blank', question:'Das Dach des Stephansdoms hat ___ farbig glasierte Ziegel.', blanks:['230.000'], hint:'Mehr als 200.000.' },
  { id:281, topic:'Stephansdom', type:'fill_blank', question:'Der Südturm wird auch ___ genannt.', blanks:['Steffl'], hint:'Ein Wiener Spitzname, beginnt mit St.' },
  { id:282, topic:'Stephansdom', type:'multiple_choice', question:'Wer schuf die berühmte Kanzel im Stephansdom?', options:['Meister Pilgram','Kaiser Friedrich III.','Mozart','Kaiser Franz Joseph'], correct:0, explanation:'Die Kanzel wird dem Baumeister Meister Pilgram zugeschrieben. Unter der Kanzel befindet sich sein Selbstbildnis (der Fenstergucker).' },
  { id:283, topic:'Stephansdom', type:'multiple_choice', question:'Was stellt der "Fenstergucker" am Stephansdom dar?', options:['Selbstbildnis von Meister Pilgram','Einen Kaiser','Einen Heiligen','Einen Engel'], correct:0, explanation:'Der Fenstergucker ist das Selbstbildnis von Meister Pilgram, dem Erbauer der Kanzel.' },
  { id:284, topic:'Stephansdom', type:'multiple_choice', question:'Welche Tiere sind an der Kanzel des Stephansdoms dargestellt?', options:['Kröten, Eidechsen, Drachen und Schlangen','Löwen und Adler','Pferde und Hunde','Fische und Vögel'], correct:0, explanation:'An der Kanzel sind Kröten, Eidechsen, Drachen und Schlangen dargestellt - sie zeigen den Kampf zwischen Gut und Böse.' },
  { id:285, topic:'Stephansdom', type:'multiple_choice', question:'Was ist die Dienstbotenmadonna im Stephansdom?', options:['Eine berühmte Madonnenfigur','Der Name einer Glocke','Ein Fenster','Ein Altar'], correct:0, explanation:'Die Dienstbotenmadonna ist eine berühmte Madonnenfigur im Stephansdom.' },

  // ── 1. BEZIRK (aus Schulbuch S.26-27, Info-Seite) ──
  { id:290, topic:'1. Bezirk', type:'multiple_choice', question:'Seit wann ist der 1. Bezirk UNESCO-Weltkulturerbe?', options:['Seit 2001','Seit 1980','Seit 2010','Seit 1950'], correct:0, explanation:'Der 1. Bezirk (Innere Stadt) ist seit 2001 UNESCO-Weltkulturerbe.' },
  { id:291, topic:'1. Bezirk', type:'multiple_choice', question:'Was ist das "Goldene U" im 1. Bezirk?', options:['Graben, Kohlmarkt und Kärntner Straße','Drei goldene Statuen','Ein Museum','Ein Platz'], correct:0, explanation:'Das "Goldene U" bilden die drei Einkaufsstraßen Graben, Kohlmarkt und Kärntner Straße.' },
  { id:292, topic:'1. Bezirk', type:'multiple_choice', question:'Was befindet sich auf dem Michaelerplatz?', options:['Der Eingang zur Hofburg','Die Pestsäule','Die Ankeruhr','Das Haas Haus'], correct:0, explanation:'Auf dem Michaelerplatz befindet sich der prachtvolle Eingang zur Hofburg.' },
  { id:293, topic:'1. Bezirk', type:'multiple_choice', question:'Was kann man auf der Freyung besichtigen?', options:['Historische Paläste und eine Kirche','Das Riesenrad','Den Stephansdom','Das Parlament'], correct:0, explanation:'Die Freyung ist ein historischer Platz im 1. Bezirk mit Palästen und der Schottenkirche.' },
  { id:294, topic:'1. Bezirk', type:'multiple_choice', question:'Wo liegt der Heldenplatz?', options:['Bei der Hofburg','Beim Stephansdom','Am Donaukanal','Im Prater'], correct:0, explanation:'Der Heldenplatz liegt direkt bei der Hofburg im 1. Bezirk.' },
  { id:295, topic:'1. Bezirk', type:'multiple_choice', question:'Was ist die Sage vom Basiliskenhaus?', options:['Ein Basilisk lebte in einem Brunnen in der Schönlaterngasse','Ein Drache auf dem Stephansdom','Ein Geist im Rathaus','Ein Riese am Riesentor'], correct:0, explanation:'Der Sage nach lebte ein giftiger Basilisk in einem Brunnen in der Schönlaterngasse im 1. Bezirk.' },
  { id:296, topic:'1. Bezirk', type:'fill_blank', question:'Die Pestsäule steht auf dem ___.', blanks:['Graben'], hint:'Eine bekannte Einkaufsstraße im 1. Bezirk.' },
  { id:297, topic:'1. Bezirk', type:'fill_blank', question:'Der 1. Bezirk ist seit 2001 UNESCO-___.', blanks:['Weltkulturerbe'], hint:'Ein besonderer Schutz für kulturell wertvolle Orte.' },
  { id:298, topic:'1. Bezirk', type:'multiple_choice', question:'Was ist Am Hof?', options:['Ein historischer Platz im 1. Bezirk','Ein Schloss','Ein Berg','Ein Fluss'], correct:0, explanation:'Am Hof ist einer der ältesten Plätze Wiens im 1. Bezirk.' },

  // ── RINGSTRASSE (aus Schulbuch S.28, Arbeitsblatt) ──
  { id:300, topic:'Ringstraße', type:'multiple_choice', question:'Was wurde neben der Stadtmauer auch eingeebnet, um die Ringstraße zu bauen?', options:['Der Stadtgraben und das Glacis','Ein Wald','Ein Friedhof','Ein Marktplatz'], correct:0, explanation:'Kaiser Franz Joseph I. ließ die Stadtmauer, den Stadtgraben und das Glacis (freies Feld vor der Mauer) einebnen.' },
  { id:301, topic:'Ringstraße', type:'multiple_choice', question:'Was ist das "Glacis"?', options:['Das freie Feld vor der Stadtmauer','Ein Fluss','Ein Park','Eine Brücke'], correct:0, explanation:'Das Glacis war das freie Feld vor der Stadtmauer - es wurde eingeebnet, um die Ringstraße zu bauen.' },
  { id:302, topic:'Ringstraße', type:'multiple_choice', question:'Wie ist die Ringstraße aufgebaut (von außen nach innen)?', options:['Gehsteig - Nebenfahrbahn - Allee - Hauptfahrbahn','Nur eine breite Straße','Gehsteig - Straße - Gehsteig','Fahrradweg - Straße - Park'], correct:0, explanation:'Die Ringstraße hat auf jeder Seite: Gehsteig (G), Nebenfahrbahn (N), Allee (A) und Hauptfahrbahn (H).' },
  { id:303, topic:'Ringstraße', type:'multiple_choice', question:'Was befindet sich zwischen Nebenfahrbahn und Hauptfahrbahn der Ringstraße?', options:['Eine Allee (Baumreihe)','Ein Zaun','Straßenbahnschienen','Parkplätze'], correct:0, explanation:'Zwischen Nebenfahrbahn und Hauptfahrbahn befindet sich eine Allee (Baumreihe), die auch als Fahrradweg dient.' },
  { id:304, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt das Rathaus?', options:['Universitätsring','Dr.-Karl-Renner-Ring','Schottenring','Burgring'], correct:0, explanation:'Das Rathaus liegt am Universitätsring.' },
  { id:305, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt das Parlament?', options:['Dr.-Karl-Renner-Ring','Universitätsring','Burgring','Opernring'], correct:0, explanation:'Das Parlament liegt am Dr.-Karl-Renner-Ring.' },
  { id:306, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt die Universität?', options:['Universitätsring','Schottenring','Stubenring','Parkring'], correct:0, explanation:'Die Universität Wien liegt am Universitätsring.' },
  { id:307, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt der Stadtpark?', options:['Parkring','Schubertring','Stubenring','Kärntner Ring'], correct:0, explanation:'Der Stadtpark liegt am Parkring.' },
  { id:308, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt die Börse?', options:['Schottenring','Stubenring','Universitätsring','Parkring'], correct:0, explanation:'Die Börse liegt am Schottenring.' },
  { id:309, topic:'Ringstraße', type:'multiple_choice', question:'In welchem Abschnitt liegt die Hofburg?', options:['Burgring','Opernring','Universitätsring','Dr.-Karl-Renner-Ring'], correct:0, explanation:'Die Hofburg liegt am Burgring.' },
  { id:310, topic:'Ringstraße', type:'fill_blank', question:'Das freie Feld vor der Stadtmauer hieß ___.', blanks:['Glacis'], hint:'Beginnt mit G.' },

  // ── RINGSTRASSE GEBÄUDE (aus Schulbuch S.18-19, S.29) ──
  { id:315, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wie viele Stücke umfasst die Sammlung des Naturhistorischen Museums?', options:['Rund 30 Millionen','Rund 1 Million','Rund 100.000','Rund 5 Millionen'], correct:0, explanation:'Das Naturhistorische Museum besitzt eine Sammlung von rund 30 Millionen Stück.' },
  { id:316, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wie viele Studenten hat die Universität Wien ungefähr?', options:['90.000','10.000','50.000','200.000'], correct:0, explanation:'Die Universität Wien hat derzeit circa 90.000 Studenten und ist die größte Hochschule Österreichs.' },
  { id:317, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wofür wird die Börse am Schottenring HEUTE genutzt?', options:['Vereinsversammlungen und Bälle','Wertpapierhandel','Als Schule','Als Museum'], correct:0, explanation:'Die Börse dient heute für Vereinsversammlungen und Bälle. Früher wurde dort mit Wertpapieren gehandelt.' },
  { id:318, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Was zeigt der Ringturm am Dach an?', options:['Das Wetter','Die Uhrzeit','Die Temperatur des Donaukanals','Nachrichten'], correct:0, explanation:'Der Ringturm hat eine Wetteranzeige auf dem Dach.' },
  { id:319, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wie hoch ist die Statue der Pallas Athene vor dem Parlament?', options:['5 Meter','2 Meter','10 Meter','1 Meter'], correct:0, explanation:'Die Statue der Pallas Athene vor dem Parlament ist 5 Meter hoch. Sie ist die griechische Göttin der Weisheit.' },
  { id:320, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Was steht auf dem Rathausturm?', options:['Der 5 Meter hohe Rathausmann','Eine Uhr','Eine Glocke','Eine Fahne'], correct:0, explanation:'Auf dem Rathausturm steht der Rathausmann - eine 5 Meter hohe Figur.' },
  { id:321, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Wer ist Pallas Athene?', options:['Griechische Göttin der Weisheit','Römische Kaiserin','Wiener Bürgermeisterin','Erbauerin des Parlaments'], correct:0, explanation:'Pallas Athene ist die griechische Göttin der Weisheit. Ihre Statue steht vor dem Parlament.' },
  { id:322, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Was kann man im Kunsthistorischen Museum sehen?', options:['Gemälde, Statuen, Mumien und Rüstungen','Nur Gemälde','Dinosaurier','Sternbilder'], correct:0, explanation:'Im Kunsthistorischen Museum sind Gemälde, Statuen, Mumien und Rüstungen ausgestellt.' },
  { id:323, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Was beherbergt die Hofburg neben der Nationalbibliothek?', options:['Die Schatzkammer','Das Naturhistorische Museum','Die Universität','Das Burgtheater'], correct:0, explanation:'Die Hofburg beherbergt neben der Nationalbibliothek auch die Schatzkammer mit den Kronjuwelen.' },
  { id:324, topic:'Ringstraße Gebäude', type:'multiple_choice', question:'Was zeigt das Weltmuseum am Heldenplatz?', options:['Wertvolle Gegenstände aus aller Welt','Nur österreichische Kunst','Dinosaurier','Weltraumforschung'], correct:0, explanation:'Das Weltmuseum am Heldenplatz zeigt wertvolle Gegenstände aus aller Welt in 14 Sälen.' },
  { id:325, topic:'Ringstraße Gebäude', type:'fill_blank', question:'Die Statue vor dem Parlament heißt ___.', blanks:['Pallas Athene'], hint:'Eine griechische Göttin.' },
  { id:326, topic:'Ringstraße Gebäude', type:'fill_blank', question:'Auf dem Rathausturm steht der ___.', blanks:['Rathausmann'], hint:'Rathaus + Mann.' },
  { id:327, topic:'Ringstraße Gebäude', type:'fill_blank', question:'Das Naturhistorische Museum hat eine Sammlung von rund ___ Millionen Stück.', blanks:['30'], hint:'Zwischen 20 und 40.' },

  // ── BEZIRKE WIENS (aus Schulbuch S.24-25) ──
  { id:330, topic:'Bezirke Wiens', type:'multiple_choice', question:'Seit wann gehören die Vororte zu Wien?', options:['Seit 1. Jänner 1892','Seit 1900','Seit 1850','Seit 1950'], correct:0, explanation:'Seit dem 1. Jänner 1892 gehören auch die Vororte zu Wien - seitdem hat Wien 23 Bezirke.' },
  { id:331, topic:'Bezirke Wiens', type:'multiple_choice', question:'Grenzen ALLE Innenbezirke (2-9) an den 1. Bezirk?', options:['Ja, alle grenzen an den 1. Bezirk','Nein, nur einige','Nein, keiner','Nur die Bezirke 2-5'], correct:0, explanation:'Ja! Alle Innenbezirke (2-9) grenzen an den 1. Bezirk (Innere Stadt).' },
  { id:332, topic:'Bezirke Wiens', type:'multiple_choice', question:'In welchem Bezirk steht der Wasserturm (Favoriten)?', options:['10. Bezirk','11. Bezirk','1. Bezirk','22. Bezirk'], correct:0, explanation:'Der Wasserturm steht im 10. Bezirk (Favoriten).' },
  { id:333, topic:'Bezirke Wiens', type:'multiple_choice', question:'Wie nannte man die Bezirke 10-23 früher?', options:['Vororte','Dörfer','Städte','Inseln'], correct:0, explanation:'Die Bezirke 10 bis 23 waren früher eigenständige Vororte, die 1892 eingemeindet wurden.' },
  { id:334, topic:'Bezirke Wiens', type:'fill_blank', question:'Seit dem 1. Jänner ___ gehören die Vororte zu Wien.', blanks:['1892'], hint:'Im 19. Jahrhundert, nach 1890.' },

  // ── KARTEN LESEN (aus Schulbuch S.9) ──
  { id:340, topic:'Karten lesen', type:'multiple_choice', question:'Was bedeutet Maßstab 1:5.000?', options:['1 cm = 5.000 cm = 50 m','1 cm = 5 km','1 km = 5.000 km','5 cm = 1 cm'], correct:0, explanation:'Maßstab 1:5.000 bedeutet: 1 cm auf der Karte entspricht 5.000 cm (= 50 Meter) in der Wirklichkeit.' },
  { id:341, topic:'Karten lesen', type:'multiple_choice', question:'Was ist KEINE typische Kartenzeichen-Bedeutung?', options:['Telefonnummer','Kirche','Schloss','Ruine'], correct:0, explanation:'Auf Landkarten gibt es Zeichen für Kirchen, Schlösser, Ruinen, Burgen etc. - aber keine Telefonnummern.' },
  { id:342, topic:'Karten lesen', type:'multiple_choice', question:'Was zeigt ein Kartenzeichen mit einem Kreuz (+) auf einer Landkarte?', options:['Eine Kirche','Ein Krankenhaus','Einen Friedhof','Eine Kreuzung'], correct:0, explanation:'Ein Kreuz auf einer Landkarte zeigt eine Kirche oder ein Kloster an.' },
  { id:343, topic:'Karten lesen', type:'fill_blank', question:'In einer ___ werden die Kartenzeichen erklärt.', blanks:['Legende'], hint:'Steht am Rand jeder Karte.' },

  // ── PLÄNE LESEN (aus Schulbuch S.10) ──
  { id:345, topic:'Pläne lesen', type:'multiple_choice', question:'Was ist der Unterschied zwischen einem Plan und einer Landkarte?', options:['Ein Plan zeigt einen kleineren Bereich genauer','Ein Plan ist immer farbig','Eine Karte ist kleiner','Kein Unterschied'], correct:0, explanation:'Ein Plan zeigt einen kleineren Bereich (z.B. eine Stadt) in größerem Detail als eine Landkarte.' },
  { id:346, topic:'Pläne lesen', type:'multiple_choice', question:'Was bedeutet "N" auf einem Plan?', options:['Norden','Nummer','Neu','Niedrig'], correct:0, explanation:'N auf einem Plan bedeutet Norden. Der obere Rand eines Plans zeigt normalerweise nach Norden.' },
  { id:347, topic:'Pläne lesen', type:'fill_blank', question:'Der obere Rand eines Plans zeigt nach ___.', blanks:['Norden'], hint:'Eine Himmelsrichtung, beginnt mit N.' },

  // ═══ WELTALL ═══
  { id:500, topic:'Weltall', type:'multiple_choice', image:'planet_sonnensystem', imageHint:'Zähle die Planeten auf dem Bild.', question:'Wie viele Planeten hat unser Sonnensystem?', options:['8','9','7','10'], correct:0, explanation:'Unser Sonnensystem hat 8 Planeten: Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus und Neptun.' },
  { id:501, topic:'Weltall', type:'multiple_choice', image:'planet_merkur', imageHint:'Das ist Merkur - der kleinste Planet.', question:'Welcher Planet ist der Sonne am nächsten?', options:['Merkur','Venus','Erde','Mars'], correct:0, explanation:'Merkur ist der Sonne am nächsten. Er ist auch der kleinste Planet im Sonnensystem.' },
  { id:502, topic:'Weltall', type:'multiple_choice', image:'planet_jupiter', imageHint:'Das ist Jupiter - erkennst du den Roten Fleck?', question:'Welcher ist der größte Planet im Sonnensystem?', options:['Jupiter','Saturn','Uranus','Neptun'], correct:0, explanation:'Jupiter ist der größte Planet. In ihm würden mehr als 1.000 Erdkugeln Platz finden!' },
  { id:503, topic:'Weltall', type:'multiple_choice', image:'planet_saturn', imageHint:'Schau dir die Ringe an!', question:'Welcher Planet ist für seine schönen Ringe bekannt?', options:['Saturn','Jupiter','Uranus','Neptun'], correct:0, explanation:'Saturn ist berühmt für seine wunderschönen Ringe, die aus Eis und Gestein bestehen.' },
  { id:504, topic:'Weltall', type:'multiple_choice', image:'planet_erde', imageHint:'Unser Heimatplanet!', question:'Auf welchem Planeten leben wir?', options:['Erde','Mars','Venus','Merkur'], correct:0, explanation:'Wir leben auf der Erde - dem einzigen Planeten, auf dem es flüssiges Wasser und Leben gibt.' },
  { id:505, topic:'Weltall', type:'multiple_choice', image:'planet_mars', imageHint:'Erkennst du die rote Farbe?', question:'Wie wird der Planet Mars noch genannt?', options:['Der Rote Planet','Der Blaue Planet','Der Grüne Planet','Der Gelbe Planet'], correct:0, explanation:'Mars wird wegen seiner roten Farbe auch der "Rote Planet" genannt. Die Farbe kommt von Eisenrost im Boden.' },
  { id:506, topic:'Weltall', type:'multiple_choice', image:'planet_sonne', imageHint:'Die Sonne - unser nächster Stern.', question:'Was ist die Sonne?', options:['Ein Stern','Ein Planet','Ein Mond','Ein Komet'], correct:0, explanation:'Die Sonne ist ein Stern - eine riesige, glühende Gaskugel. Sie spendet uns Licht und Wärme.' },
  { id:507, topic:'Weltall', type:'multiple_choice', question:'Wie lange braucht die Erde für eine Umrundung der Sonne?', options:['Etwa 365 Tage (1 Jahr)','Etwa 30 Tage (1 Monat)','Etwa 24 Stunden (1 Tag)','Etwa 7 Tage (1 Woche)'], correct:0, explanation:'Die Erde braucht etwa 365 Tage - also ein ganzes Jahr - um einmal die Sonne zu umrunden.' },
  { id:508, topic:'Weltall', type:'multiple_choice', question:'Was verursacht Tag und Nacht auf der Erde?', options:['Die Erde dreht sich um sich selbst','Die Sonne dreht sich um die Erde','Der Mond verdeckt die Sonne','Die Erde bewegt sich nicht'], correct:0, explanation:'Die Erde dreht sich einmal am Tag um ihre eigene Achse. Die Seite, die zur Sonne zeigt, hat Tag - die andere Nacht.' },
  { id:509, topic:'Weltall', type:'multiple_choice', image:'planet_milchstrasse', imageHint:'So sieht unsere Galaxie aus!', question:'Was ist die Milchstraße?', options:['Unsere Galaxie','Ein Fluss im Weltall','Ein besonders heller Stern','Ein Planet'], correct:0, explanation:'Die Milchstraße ist unsere Galaxie - eine riesige Ansammlung von Milliarden von Sternen, zu der auch unsere Sonne gehört.' },
  { id:510, topic:'Weltall', type:'multiple_choice', question:'Welcher Planet ist unser nächster Nachbar?', options:['Mars','Jupiter','Saturn','Neptun'], correct:0, explanation:'Mars ist unser nächster Nachbarplanet. Er wird auch als "Roter Planet" bezeichnet.' },
  { id:511, topic:'Weltall', type:'multiple_choice', question:'Warum ist Pluto kein Planet mehr?', options:['Er wurde als Zwergplanet eingestuft','Er ist explodiert','Er ist zu heiß','Er wurde noch nie gesehen'], correct:0, explanation:'Seit 2006 gilt Pluto als Zwergplanet, weil er zu klein ist und seine Umlaufbahn nicht von anderen Objekten freigeräumt hat.' },
  { id:512, topic:'Weltall', type:'multiple_choice', image:'planet_mond', imageHint:'Unser treuer Begleiter am Nachthimmel.', question:'Wie heißt der natürliche Begleiter der Erde?', options:['Der Mond','Die Sonne','Der Mars','Der Polarstern'], correct:0, explanation:'Der Mond ist der natürliche Begleiter (Trabant) der Erde. Er umkreist die Erde etwa einmal im Monat.' },
  { id:513, topic:'Weltall', type:'multiple_choice', image:'planet_neptun', imageHint:'Neptun - weit draußen im Sonnensystem.', question:'Welcher Planet ist am weitesten von der Sonne entfernt?', options:['Neptun','Uranus','Saturn','Pluto'], correct:0, explanation:'Neptun ist der äußerste Planet unseres Sonnensystems. Er ist sehr kalt und weit von der Sonne entfernt.' },
  { id:514, topic:'Weltall', type:'multiple_choice', question:'Welche Reihenfolge der Planeten von der Sonne aus ist richtig?', options:['Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus, Neptun','Venus, Merkur, Erde, Mars, Jupiter, Saturn, Neptun, Uranus','Erde, Venus, Merkur, Mars, Jupiter, Saturn, Uranus, Neptun','Merkur, Venus, Mars, Erde, Jupiter, Saturn, Uranus, Neptun'], correct:0, explanation:'Merksatz: Mein Vater Erklärt Mir Jeden Sonntag Unseren Nachthimmel (Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus, Neptun).' },
  { id:515, topic:'Weltall', type:'multiple_choice', question:'Was ist ein Stern?', options:['Eine glühende Gaskugel','Ein kalter Felsbrocken','Ein leuchtender Planet','Ein großer Mond'], correct:0, explanation:'Ein Stern ist eine riesige, glühende Gaskugel. In seinem Inneren finden Kernreaktionen statt, die Licht und Wärme erzeugen.' },
  { id:516, topic:'Weltall', type:'fill_blank', question:'Unser Sonnensystem hat ___ Planeten.', blanks:['8'], hint:'Mehr als 7, weniger als 9.' },
  { id:517, topic:'Weltall', type:'fill_blank', question:'Der größte Planet heißt ___.', blanks:['Jupiter'], hint:'Beginnt mit J.' },
  { id:518, topic:'Weltall', type:'fill_blank', question:'Die Erde braucht ___ Tage für eine Umrundung der Sonne.', blanks:['365'], hint:'So viele Tage hat ein Jahr.' },
  { id:519, topic:'Weltall', type:'fill_blank', question:'Der natürliche Begleiter der Erde heißt ___.', blanks:['Mond'], hint:'Man sieht ihn nachts am Himmel.' },
  { id:520, topic:'Weltall', type:'multiple_choice', question:'Woraus bestehen die Ringe des Saturn hauptsächlich?', options:['Eis und Gestein','Gas und Staub','Wasser und Sand','Metall und Glas'], correct:0, explanation:'Die Ringe des Saturn bestehen hauptsächlich aus Eis- und Gesteinsbrocken verschiedener Größe.' },
];

export const MATERIALS = [
  { topic: 'Karten lesen', images: [
    { key: 'karten_lesen', label: 'Karten lesen - Legende, Massstab, Planquadrate' },
  ]},
  { topic: 'Pläne lesen', images: [
    { key: 'plaene_lesen', label: 'Pläne lesen - Stadtplan mit Himmelsrichtungen' },
  ]},
  { topic: 'Bezirke Wiens', images: [
    { key: 'bezirke_wien', label: 'Bezirke Wiens - Karte und Liste' },
    { key: 'bezirke_bauwerke', label: 'Bauwerke in den Bezirken' },
  ]},
  { topic: '1. Bezirk', images: [
    { key: 'erster_bezirk', label: '1. Bezirk - Innere Stadt' },
    { key: 'erster_bezirk_plaetze', label: 'Plätze im 1. Bezirk' },
    { key: 'erster_bezirk_info', label: '1. Bezirk - Infos und Museen' },
  ]},
  { topic: 'Ringstraße', images: [
    { key: 'ringstrasse', label: 'Ringstraße - Geschichte und Plan' },
    { key: 'ringstrasse_sheet', label: 'Ringstraße - Abschnitte' },
    { key: 'ringstrasse_karte', label: 'Ringstraße - Karte' },
  ]},
  { topic: 'Ringstraße Gebäude', images: [
    { key: 'ringstrasse_gebaeude', label: 'Ringstraße - Gebäude Fotos' },
    { key: 'ringstrasse_liste', label: 'Ringstraße - Gebäude Beschreibungen' },
    { key: 'ringstrasse_fotos', label: 'Ringstraße - Karte mit Gebäuden' },
  ]},
  { topic: 'Stephansdom', images: [
    { key: 'stephansdom', label: 'Stephansdom - Übersicht und Geschichte' },
    { key: 'stephansdom_aussen', label: 'Stephansdom - Außen (Türme, Riesentor)' },
    { key: 'stephansdom_innen', label: 'Stephansdom - Innen (Pummerin, Rosettenfenster)' },
    { key: 'stephansdom_innen2', label: 'Stephansdom - Innen (Fenstergucker, Kanzel)' },
  ]},
  { topic: 'Weltall', images: [
    { key: 'planet_sonnensystem', label: 'Unser Sonnensystem' },
    { key: 'planet_sonne', label: 'Die Sonne' },
    { key: 'planet_erde', label: 'Die Erde' },
    { key: 'planet_mond', label: 'Der Mond' },
    { key: 'planet_milchstrasse', label: 'Die Milchstraße' },
  ]},
];

export const TOPICS = [...new Set(QUESTIONS.map(q => q.topic))];
export const getQuestionsByTopic = (topic) =>
  topic === 'Alle' ? QUESTIONS : QUESTIONS.filter(q => q.topic === topic);
export const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
