// Registers a document before any editor is created. Imported for its side
// effect at the top of every editor test.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (typeof document === 'undefined') GlobalRegistrator.register();
