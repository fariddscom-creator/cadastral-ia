# Guide de Contribution Dashboard Vision AI + SIG Cadastre Algérien

## Comment contribuer ?

### Code
1. Fork le projet GitHub
2. Créer branche `type/feature-desc`
3. Commit avec message convention git commit :feat | fix | docs
4. PR vers main, attendre review mainteneur

### Tests
```bash
npm test           # Lancer tests dashboard Vision AI + SIG
npm run lint       # Valider code avec ESLint TypeScript E6+ TSX React JSX ES6+TSXTS
```

### Documentation
- Mettre à jour API.md avec nouveaux endpoints
- Docs/ARCHITECTURE.md pour changements architecture  
- README.md pour ajouts installation usage

### Code review checklist
- Typescript strict mode activé (`tsconfig.json`)
- Composants React Hooks rules respectés (useEffect, useState)
- ESLint errors 0 / warnings < 5
- Tests unitaires ajoutés sinon code modifié

---

*Voir API.md et docs/* pour plus de contexte !*
