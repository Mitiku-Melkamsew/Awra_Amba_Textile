import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { catalogApi } from "../api";
import type { AvailableFabric } from "../api";

interface FabricCardItem {
  id: number;
  category: string;
  title: string;
  specs: string;
  price: string;
  rawPrice: number;
  patternType: "geberdin" | "zigzag" | "stripes";
}

function derivePattern(design: string): "geberdin" | "zigzag" | "stripes" {
  const d = design.toLowerCase();
  if (d.includes("zigzag")) return "zigzag";
  if (d.includes("stripe") || d.includes("tibeb") || d.includes("line")) return "stripes";
  return "geberdin";
}

function mapVariantToCard(v: AvailableFabric): FabricCardItem {
  const warp = v.warpColor || "Natural";
  const weft = v.weftColor || "Natural";
  const colorStr = weft && weft !== warp ? `${warp}/${weft}` : warp;
  const designStr = v.design || "geberdin";
  const priceNum = Number(v.sellingPrice) || 0;

  return {
    id: v.fabricVariantId,
    category: (v.fabricName || "medebegna").toLowerCase(),
    title: `${(v.fabricName || "fabric").toLowerCase()} · ${colorStr.toLowerCase()} · ${designStr.toLowerCase()}`,
    specs: `${v.standardWeightG ?? 500} g · ${v.standardLengthCm ?? 240} × ${v.standardWidthCm ?? 150} cm`,
    price: priceNum > 0 ? `${priceNum.toLocaleString()} ETB per piece` : "Official price on request",
    rawPrice: priceNum,
    patternType: derivePattern(designStr),
  };
}

export function PublicHomePage() {
  const { user } = useAuth();
  const [fabrics, setFabrics] = useState<FabricCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [lang, setLang] = useState<"am" | "en">("en");

  // Fetch actual catalog data from backend
  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      setLoading(true);
      try {
        const liveVariants = await catalogApi.publicCatalog();
        if (isMounted && Array.isArray(liveVariants) && liveVariants.length > 0) {
          const mapped = liveVariants.map(mapVariantToCard);
          setFabrics(mapped);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to checking fabric prices if public catalog is unavailable
      }

      try {
        const prices = await catalogApi.fabricPrices();
        if (isMounted && Array.isArray(prices) && prices.length > 0) {
          const mappedFromPrices: FabricCardItem[] = prices
            .filter((p) => p.isActive !== false && p.fabric)
            .map((p, idx) => {
              const fname = p.fabric?.name || "Fabric";
              const sp = Number(p.sellingPrice) || 0;
              return {
                id: p.fabricPriceId || idx + 1,
                category: fname.toLowerCase(),
                title: fname,
                specs: `${p.fabric?.standardWeightG ?? 500} g · ${p.fabric?.standardLengthCm ?? 240} × ${p.fabric?.standardWidthCm ?? 150} cm`,
                price: sp > 0 ? `${sp.toLocaleString()} ETB per piece` : "Official price on request",
                rawPrice: sp,
                patternType: "geberdin",
              };
            });
          setFabrics(mappedFromPrices);
        } else if (isMounted) {
          setFabrics([]);
        }
      } catch {
        if (isMounted) setFabrics([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute category pills dynamically from active fabrics
  const categories = useMemo(() => {
    const set = new Set<string>();
    fabrics.forEach((f) => set.add(f.category));
    return ["All", ...Array.from(set)];
  }, [fabrics]);

  // Filtered fabrics for the grid
  const filteredFabrics = useMemo(() => {
    if (selectedCategory === "All") return fabrics;
    return fabrics.filter((f) => f.category === selectedCategory);
  }, [fabrics, selectedCategory]);

  // Top fabrics for hero preview cards
  const heroCard1 = useMemo(
    () => fabrics.find((f) => f.category === "medebegna") || fabrics[0],
    [fabrics]
  );
  const heroCard2 = useMemo(
    () => fabrics.find((f) => f.category === "gabi") || fabrics[1],
    [fabrics]
  );
  const heroCard3 = useMemo(
    () => fabrics.find((f) => f.category === "netela") || fabrics[2],
    [fabrics]
  );

  return (
    <div className="public-home-container">
      {/* ── Top Navbar ── */}
      <header className="public-navbar">
        <div className="public-navbar-inner">
          {/* Brand */}
          <div className="public-brand">
            <div className="public-brand-mark">
              <span>አ</span>
            </div>
            <div className="public-brand-titles">
              <span className="public-brand-name">Awra Amba Textile</span>
              <span className="public-brand-sub">አውራ አምባ ቴክስታይል ማህበር</span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="public-nav-links">
            <a href="#fabrics">{lang === "en" ? "Fabrics" : "ጨርቆች"}</a>
            <a href="#how-to-order">{lang === "en" ? "How to order" : "እንዴት ማዘዝ እንደሚቻል"}</a>
            <a href="#contact">{lang === "en" ? "Contact" : "አድራሻ"}</a>
          </nav>

          {/* Right Actions */}
          <div className="public-nav-actions">
            <button
              type="button"
              className="public-lang-pill"
              onClick={() => setLang(lang === "en" ? "am" : "en")}
            >
              {lang === "en" ? "አማ · EN" : "EN · አማ"}
            </button>

            {user ? (
              <Link
                to={
                  user.roles?.includes("admin") || user.role === "admin"
                    ? "/admin"
                    : user.roles?.includes("weaver") || user.role === "weaver"
                    ? "/weaver"
                    : "/merchant"
                }
                className="btn btn-primary btn-sm"
              >
                {lang === "en" ? "Go to Dashboard →" : "ወደ ዳሽቦርድ ሂድ →"}
              </Link>
            ) : (
              <>
                <Link to="/login" className="public-staff-link">
                  {lang === "en" ? "Sign in" : "ግባ"}
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  {lang === "en" ? "Sign up" : "ተመዝገብ"}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="public-hero-section">
        <div className="public-hero-inner">
          {/* Left Text */}
          <div className="public-hero-left">
            <span className="public-badge-pill">
              {lang === "en" ? "For merchants and wholesalers" : "ለንግድ ነጋዴዎች እና ጅምላ ሻጮች"}
            </span>

            <h1 className="public-hero-heading">
              {lang === "en"
                ? "Fabric from the weavers' cooperative, at official prices."
                : "የአውራ አምባ ሸማኔዎች ማህበር ጨርቅ፣ በይፋዊ ዋጋ።"}
            </h1>

            <p className="public-hero-sub">
              {lang === "en"
                ? "See what is available, compare patterns and colors, and check the price list before you order."
                : "ያሉትን ጨርቆች ይመልከቱ፣ ቅጦችና ቀለሞችን ያነጻጽሩ፣ ከማዘዝዎ በፊት የዋጋ ዝርዝሩን ይመርምሩ።"}
            </p>

            <div className="public-hero-cta">
              <a href="#fabrics" className="btn btn-primary">
                {lang === "en" ? "Browse fabrics →" : "ጨርቆችን ይመልከቱ →"}
              </a>
              <Link to="/signup?role=merchant" className="btn btn-secondary">
                {lang === "en" ? "Create a merchant account" : "የነጋዴ መለያ ይፍጠሩ"}
              </Link>
            </div>

            {/* Checkmark Bullets */}
            <div className="public-hero-checks">
              <span className="hero-check-item">
                <span className="check-icon">✓</span>{" "}
                {lang === "en" ? "Official price list" : "ይፋዊ የዋጋ ዝርዝር"}
              </span>
              <span className="hero-check-item">
                <span className="check-icon">✓</span>{" "}
                {lang === "en" ? "Filter by fabric and color" : "በጨርቅና ቀለም ያጣሩ"}
              </span>
              <span className="hero-check-item">
                <span className="check-icon">✓</span>{" "}
                {lang === "en" ? "Print the list" : "ዝርዝሩን ያትሙ"}
              </span>
            </div>
          </div>

          {/* Right Stacked Preview Cards */}
          <div className="public-hero-right">
            {heroCard1 ? (
              <div className="stacked-cards-container">
                {/* Card 1 */}
                <div className="stacked-preview-card card-top">
                  <div className={`woven-swatch-banner swatch-${heroCard1.patternType}`}></div>
                  <div className="stacked-card-body">
                    <div className="stacked-card-title">{heroCard1.title}</div>
                    <div className="stacked-card-specs">{heroCard1.specs}</div>
                    <div className="stacked-card-price">{heroCard1.rawPrice.toLocaleString()}</div>
                  </div>
                </div>

                {/* Card 2 */}
                {heroCard2 && (
                  <div className="stacked-preview-card card-mid">
                    <div className={`woven-swatch-banner swatch-${heroCard2.patternType}`}></div>
                    <div className="stacked-card-body">
                      <div className="stacked-card-title">{heroCard2.title}</div>
                      <div className="stacked-card-specs">{heroCard2.specs}</div>
                      <div className="stacked-card-price">{heroCard2.rawPrice.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Card 3 */}
                {heroCard3 && (
                  <div className="stacked-preview-card card-bot">
                    <div className={`woven-swatch-banner swatch-${heroCard3.patternType}`}></div>
                    <div className="stacked-card-body">
                      <div className="stacked-card-title">{heroCard3.title}</div>
                      <div className="stacked-card-specs">{heroCard3.specs}</div>
                      <div className="stacked-card-price">
                        {heroCard3.rawPrice.toLocaleString()}{" "}
                        <span className="price-unit">ETB per piece</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Available Fabrics Section ── */}
      <section id="fabrics" className="public-fabrics-section">
        <div className="public-section-header">
          <div>
            <h2 className="public-section-title">
              {lang === "en" ? "Available fabrics" : "የሚገኙ ጨርቆች"}
            </h2>
            <p className="public-section-sub">
              {lang === "en"
                ? "A selection from the current price list."
                : "ከአሁኑ ይፋዊ የዋጋ ዝርዝር የተመረጡ።"}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="category-filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid or Status */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            Loading fabrics from cooperative catalog…
          </div>
        ) : filteredFabrics.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            No fabrics currently available in the public catalog.
          </div>
        ) : (
          <div className="fabrics-grid">
            {filteredFabrics.map((fabric) => (
              <div key={fabric.id} className="card fabric-item-card">
                <div className={`fabric-swatch-header swatch-${fabric.patternType}`}></div>
                <div className="fabric-card-content">
                  <h3 className="fabric-card-title">{fabric.title}</h3>
                  <p className="fabric-card-specs">{fabric.specs}</p>
                  <div className="fabric-card-price">{fabric.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Button to browse all */}
        <div className="fabrics-section-footer">
          <Link to="/merchant" className="btn btn-secondary">
            {lang === "en"
              ? "See all fabrics, filter by warp and weft →"
              : "ሁሉንም ጨርቆች ይመልከቱ፣ በድርና ማግ ያጣሩ →"}
          </Link>
        </div>
      </section>

      {/* ── How to order Section ── */}
      <section id="how-to-order" className="public-steps-section">
        <h2 className="public-section-title">
          {lang === "en" ? "How to order" : "እንዴት ማዘዝ እንደሚቻል"}
        </h2>

        <div className="steps-three-grid">
          {/* Step 1 */}
          <div className="step-card">
            <div className="step-number-badge">1</div>
            <h3 className="step-title">
              {lang === "en" ? "Create your merchant account" : "የነጋዴ መለያዎን ይፍጠሩ"}
            </h3>
            <p className="step-desc">
              {lang === "en"
                ? "It takes a minute. You only need a name, phone number and password."
                : "አንድ ደቂቃ ብቻ ይወስዳል። ስም፣ ስልክ ቁጥር እና የይለፍ ቃል ብቻ ያስፈልግዎታል።"}
            </p>
          </div>

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-number-badge">2</div>
            <h3 className="step-title">
              {lang === "en" ? "Browse fabrics and prices" : "ጨርቆችንና ዋጋዎችን ይመልከቱ"}
            </h3>
            <p className="step-desc">
              {lang === "en"
                ? "Filter by fabric, warp and weft, then print the price list for your records."
                : "በጨርቅ፣ ድርና ማግ ያጣሩ፣ ከዚያም ለሰነድዎ የዋጋ ዝርዝሩን ያትሙ።"}
            </p>
          </div>

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-number-badge">3</div>
            <h3 className="step-title">
              {lang === "en" ? "Contact the office to order" : "ለማዘዝ ቢሮውን ያግኙ"}
            </h3>
            <p className="step-desc">
              {lang === "en"
                ? "Call or visit the cooperative office: +251 91 800 0000."
                : "የማህበሩን ቢሮ ይደውሉ ወይም ይጎብኙ፡ +251 91 800 0000።"}
            </p>
          </div>
        </div>
      </section>

      {/* ── About & Contact Footer Section ── */}
      <footer id="contact" className="public-footer-section">
        <div className="footer-cards-grid">
          {/* Card 1: About */}
          <div className="card footer-info-card">
            <h3 className="footer-info-title">
              {lang === "en" ? "About the cooperative" : "ስለ ማህበሩ"}
            </h3>
            <p className="footer-info-text">
              {lang === "en"
                ? "Founded in 1972 on principles of equality, social justice, and collective labor, Awra Amba is an intentional community in the Amhara region of Ethiopia renowned for producing premium handwoven textiles."
                : "በ1972 ዓ.ም በእኩልነት፣ ማህበራዊ ፍትህ እና የጋራ የስራ ባህል መርሆዎች የተመሰረተው አውራ አምባ ማህበረሰብ፣ በኢትዮጵያ አማራ ክልል ከፍተኛ ጥራት ያላቸውን የእጅ ሸማ ጨርቆች በማምረት የታወቀ ነው።"}
            </p>
          </div>

          {/* Card 2: Visit or call */}
          <div className="card footer-info-card">
            <h3 className="footer-info-title">
              {lang === "en" ? "Visit or call" : "ይጎብኙ ወይም ይደውሉ"}
            </h3>
            <span className="footer-phone-label">{lang === "en" ? "Phone" : "ስልክ"}</span>
            <p className="footer-phone-val">+251 91 800 0000</p>
            <p className="footer-info-text" style={{ marginTop: "0.5rem" }}>
              {lang === "en"
                ? "Awra Amba Cooperative Office · Fogera Woreda, South Gondar, Amhara, Ethiopia"
                : "የአውራ አምባ ማህበር ቢሮ · ፎገራ ወረዳ፣ ደቡብ ጎንደር፣ አማራ ክልል፣ ኢትዮጵያ"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicHomePage;