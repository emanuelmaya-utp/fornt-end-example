import { Injectable, signal } from '@angular/core';
import { translations, Lang } from '../models/translations';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>((localStorage.getItem('lang') as Lang) ?? 'es');

  toggle(): void {
    this.setLang(this.lang() === 'es' ? 'en' : 'es');
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem('lang', lang);
  }

  t(key: string): string {
    return translations[this.lang()][key] ?? key;
  }
}
