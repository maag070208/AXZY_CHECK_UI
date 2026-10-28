import { ITButton, ITCard, ITEmptyState, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useNavigate, useParams } from "react-router-dom";
import { LegalMarkdown } from "../components/LegalMarkdown";
import { LEGAL_DOCS, LEGAL_KEYS, type LegalDocKey } from "../legal.config";

/** Documentos legales públicos (sin sesión): /legal/:doc */
const LegalPage = () => {
  const { doc } = useParams();
  const navigate = useNavigate();
  const current = LEGAL_KEYS.includes(doc as LegalDocKey) ? LEGAL_DOCS[doc as LegalDocKey] : null;

  return (
    <ITFlex direction="column" gap={4} className="mx-auto w-full max-w-3xl p-4 pb-10">
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITText as="h1" className="text-xl font-bold! text-slate-900!">Información legal</ITText>
        <ITButton variant="text" color="gray" type="button" onClick={() => navigate("/login")}>Volver</ITButton>
      </ITFlex>

      <ITText as="nav" aria-label="Documentos legales">
        <ITFlex wrap="wrap" gap={2}>
        {LEGAL_KEYS.map((key) => (
          <ITButton
            key={key}
            type="button"
            size="sm"
            variant={key === doc ? "filled" : "outlined"}
            onClick={() => navigate(`/legal/${key}`)}
          >
            {LEGAL_DOCS[key].label}
          </ITButton>
        ))}
        </ITFlex>
      </ITText>

      <ITCard>
        {current ? (
          <LegalMarkdown source={current.source} />
        ) : (
          <ITEmptyState title="Elige un documento" description="Selecciona arriba el aviso o documento que quieres consultar." />
        )}
      </ITCard>
    </ITFlex>
  );
};

export default LegalPage;
