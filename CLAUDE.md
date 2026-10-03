# Mobile Game Fixer MCP - Geliştirme Kuralları

- **Tasarım Kaynağı:** Tek gerçek kaynak `docs/mobile-game-fixer-mcp-rehberi.md`. Çelişki varsa o dosya kazanır, çelişkiyi kullanıcıya bildir.
- **Determinizm:** Sunucu hiçbir zaman LLM çağırmaz, harici ağ erişimi (`fetch`/`http`/`https`) veya `child_process` kullanmaz. Aynı girdi her zaman aynı çıktıyı verir.
- **Salt Okunur (Read-Only):** Sunucu analiz ettiği veya çalıştığı hedef projelerdeki hiçbir dosyayı değiştirmez veya silmez.
- **Kaynak Güvenilirliği:** Asla kaynak (URL) uydurma. Doğrulanmamış sayfaları kaynak gösterme; `sources` boş kalmalı ve `confidence` düşürülmeli (`heuristic`/`established`).
- **Tazelik ve Kural Bütünlüğü:** Mağaza kuralı ve tarih içeren her bilgi zorunlu olarak `sources` ve `verifiedAt` (ISO-8601 YYYY-MM-DD) taşır. `policy` kayıtlarında `sources` boş olamaz.
- **Test Odaklı Geliştirme:** Önce test, sonra kod. Her değişiklikten sonra `npm test` ve `npm run validate-knowledge` yeşil olmalıdır.
- **Dil Ayrımı:** Kod, dosya isimleri, tip tanımları ve kimlikler (ID) İngilizce; kullanıcıya dönük raporlar, açıklamalar ve bilgi tabanı Türkçe olmalıdır.
- **Şüphe Durumu:** Emin olunmayan mimari veya alan kararlarında varsayımda bulunma, kullanıcıya sor.
