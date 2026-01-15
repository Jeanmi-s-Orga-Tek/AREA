/*
 @licstart  The following is the entire license notice for the JavaScript code in this file.

 The MIT License (MIT)

 Copyright (C) 1997-2020 by Dimitri van Heesch

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 and associated documentation files (the "Software"), to deal in the Software without restriction,
 including without limitation the rights to use, copy, modify, merge, publish, distribute,
 sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or
 substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 @licend  The above is the entire license notice for the JavaScript code in this file
*/
var NAVTREE =
[
  [ "AREA", "index.html", [
    [ "ACTION-REACTION (AREA)", "index.html", "index" ],
    [ "Action Handler Architecture", "md_docs_2action__handler__architecture.html", [
      [ "Overview", "md_docs_2action__handler__architecture.html#autotoc_md1", null ],
      [ "Architecture", "md_docs_2action__handler__architecture.html#autotoc_md2", [
        [ "Directory Structure", "md_docs_2action__handler__architecture.html#autotoc_md3", null ],
        [ "Base Classes", "md_docs_2action__handler__architecture.html#autotoc_md4", null ],
        [ "Handler Registry", "md_docs_2action__handler__architecture.html#autotoc_md5", null ]
      ] ],
      [ "Name Mapping", "md_docs_2action__handler__architecture.html#autotoc_md6", null ],
      [ "Adding a New Service", "md_docs_2action__handler__architecture.html#autotoc_md7", [
        [ "Create Handler File", "md_docs_2action__handler__architecture.html#autotoc_md8", null ],
        [ "Register Handlers", "md_docs_2action__handler__architecture.html#autotoc_md9", null ],
        [ "Add Webhook Endpoint", "md_docs_2action__handler__architecture.html#autotoc_md10", null ],
        [ "Create Action YAML", "md_docs_2action__handler__architecture.html#autotoc_md11", null ]
      ] ],
      [ "Payload Standardization", "md_docs_2action__handler__architecture.html#autotoc_md12", null ],
      [ "Key Benefits", "md_docs_2action__handler__architecture.html#autotoc_md13", null ],
      [ "Examples", "md_docs_2action__handler__architecture.html#autotoc_md14", [
        [ "Existing Handlers", "md_docs_2action__handler__architecture.html#autotoc_md15", null ]
      ] ]
    ] ],
    [ "Tests d'authentification Backend", "md_docs_2backend-auth-tests.html", [
      [ "Prérequis", "md_docs_2backend-auth-tests.html#autotoc_md17", null ],
      [ "Lancer les tests", "md_docs_2backend-auth-tests.html#autotoc_md18", null ],
      [ "Lire les résultats", "md_docs_2backend-auth-tests.html#autotoc_md19", null ]
    ] ],
    [ "Diagrammes des entités AREA", "md_docs_2diagrams.html", [
      [ "Diagramme de classes UML", "md_docs_2diagrams.html#autotoc_md21", [
        [ "Légende", "md_docs_2diagrams.html#autotoc_md22", null ]
      ] ],
      [ "Diagramme de séquence (Action → Hook → REAction)", "md_docs_2diagrams.html#autotoc_md23", null ]
    ] ],
    [ "Ajouter un Service, une Action et une REAction", "md_docs_2HOWTOCONTRIBUTE.html", [
      [ "Nouveau Service", "md_docs_2HOWTOCONTRIBUTE.html#autotoc_md25", null ],
      [ "Nouvelle Action", "md_docs_2HOWTOCONTRIBUTE.html#autotoc_md26", null ],
      [ "Nouvelle REAction", "md_docs_2HOWTOCONTRIBUTE.html#autotoc_md27", null ],
      [ "Checklist finale", "md_docs_2HOWTOCONTRIBUTE.html#autotoc_md28", null ]
    ] ],
    [ "Scénario E2E AREA", "md_docs_2scenario__user.html", [
      [ "Créer un utilisateur", "md_docs_2scenario__user.html#autotoc_md30", null ],
      [ "Connecter un service", "md_docs_2scenario__user.html#autotoc_md31", null ],
      [ "Créer un AREA", "md_docs_2scenario__user.html#autotoc_md32", null ],
      [ "Produire un événement", "md_docs_2scenario__user.html#autotoc_md33", null ],
      [ "Vérifier la REAction", "md_docs_2scenario__user.html#autotoc_md34", null ],
      [ "Diagramme de fonctionnement", "md_docs_2scenario__user.html#autotoc_md35", null ]
    ] ],
    [ "Tests unitaires – Scheduler / Hook", "md_docs_2Scheduler__and__hook.html", [
      [ "Objectif", "md_docs_2Scheduler__and__hook.html#autotoc_md37", null ],
      [ "Pré-requis techniques", "md_docs_2Scheduler__and__hook.html#autotoc_md39", null ],
      [ "Cas de test principaux", "md_docs_2Scheduler__and__hook.html#autotoc_md41", [
        [ "Déclenchement d’une Action factice planifiée", "md_docs_2Scheduler__and__hook.html#autotoc_md42", null ],
        [ "Appel des Hooks associés après l’Action", "md_docs_2Scheduler__and__hook.html#autotoc_md44", null ],
        [ "Appel des REActions associées aux Hooks", "md_docs_2Scheduler__and__hook.html#autotoc_md46", null ],
        [ "Cas d’erreur : Action échoue, quelles REActions ?", "md_docs_2Scheduler__and__hook.html#autotoc_md48", null ]
      ] ],
      [ "Recommandations d’implémentation des tests “réels”", "md_docs_2Scheduler__and__hook.html#autotoc_md50", null ],
      [ "Diagramme simplifié du flux testé", "md_docs_2Scheduler__and__hook.html#autotoc_md52", null ]
    ] ],
    [ "Packages", "namespaces.html", [
      [ "Package List", "namespaces.html", "namespaces_dup" ],
      [ "Package Members", "namespacemembers.html", [
        [ "All", "namespacemembers.html", null ],
        [ "Functions", "namespacemembers_func.html", null ],
        [ "Variables", "namespacemembers_vars.html", null ]
      ] ]
    ] ],
    [ "Classes", "annotated.html", [
      [ "Class List", "annotated.html", "annotated_dup" ],
      [ "Class Index", "classes.html", null ],
      [ "Class Hierarchy", "hierarchy.html", "hierarchy" ],
      [ "Class Members", "functions.html", [
        [ "All", "functions.html", "functions_dup" ],
        [ "Functions", "functions_func.html", null ],
        [ "Variables", "functions_vars.html", null ]
      ] ]
    ] ],
    [ "Files", "files.html", [
      [ "File List", "files.html", "files_dup" ],
      [ "File Members", "globals.html", [
        [ "All", "globals.html", "globals_dup" ],
        [ "Functions", "globals_func.html", null ],
        [ "Variables", "globals_vars.html", "globals_vars" ]
      ] ]
    ] ]
  ] ]
];

var NAVTREEINDEX =
[
"AboutScreen_8test_8tsx.html",
"ServiceCallbackScreen_8tsx.html#a045c8134156d24611e3c41c542046cd1",
"area__engine_8py.html#ae53477596d69e4222be1d276a1a63262",
"classapp_1_1handlers_1_1spotify_1_1SpotifyTrackAddedToPlaylistHandler.html",
"classapp_1_1oauth__models_1_1UserServiceSubscription.html",
"classes__6_8js_source.html",
"executors_2base_8py.html#ada89b6c9eac3d66e7c1dc1f93fc6a1c2",
"md_docs_2Scheduler__and__hook.html#autotoc_md46",
"namespaceapp_8js.html",
"test__about_8py.html#af87ee623c05e0614daeae148cda88038"
];

var SYNCONMSG = 'click to disable panel synchronisation';
var SYNCOFFMSG = 'click to enable panel synchronisation';