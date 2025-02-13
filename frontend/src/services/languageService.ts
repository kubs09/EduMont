export type Language = 'cs' | 'en';

class LanguageService {
  private readonly STORAGE_KEY = 'language';
  private readonly DEFAULT_LANGUAGE: Language = 'cs';

  public getLanguage(): Language {
    return (localStorage.getItem(this.STORAGE_KEY) as Language) || this.DEFAULT_LANGUAGE;
  }

  public setLanguage(language: Language): void {
    localStorage.setItem(this.STORAGE_KEY, language);
  }

  public getRequestConfig() {
    const language = this.getLanguage();
    return {
      headers: {
        'Accept-Language': language,
      },
      data: {
        language,
      },
    };
  }
}

export const languageService = new LanguageService();
