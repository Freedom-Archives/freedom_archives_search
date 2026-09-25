import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { FormErrors } from "src/components/form/BaseForm";
import ButtonsHeader from "src/components/form/ButtonsHeader";
import useFormManagerContext from "src/components/form/FormManagerContext";
import Show from "src/components/Show";

const emptyArray = [];
const emptyObject = {};
export const Section = ({ header, elements, service, embedded, ...props }) => {
  if (!elements.length) return null;
  const justifyContent = elements.length === 1 ? "center" : "space-between";
  return (
    <Paper {...props} elevation={embedded ? 0 : 1}>
      <Grid size="grow" style={{ flex: "none" }}>
        <Grid container alignContent="center" alignItems="center" justifyContent={justifyContent} spacing={2}>
          {elements.map((item) => (
            <Grid key={item.key} flex="1 1 auto" style={{ textAlign: "center" }}>
              {item}
            </Grid>
          ))}
        </Grid>
        {header && service && <FormErrors service={service} embedded />}
      </Grid>
    </Paper>
  );
};

function ViewContainer({
  children,
  buttons,
  embedded,
  noPaper = false,
  footerElements = emptyArray,
  headerElements = emptyArray,
  service,
  containerProps = emptyObject,
}) {
  const { isLoading } = useFormManagerContext();

  logger.log("VIEW CONTAINER RENDER");

  const Container = noPaper ? Box : Paper;

  return (
    <Stack direction="column" spacing={embedded ? 1 : 2} useFlexGap className="scroll-container">
      <Section elements={[...headerElements, ...(buttons ? [<ButtonsHeader key="buttons" buttons={buttons} />] : [])]} header service={service} embedded={embedded} />
      <Container id="contents" className="flex-container" {...containerProps} elevation={embedded ? 0 : 1}>
        <Show when={!isLoading}>{children}</Show>
      </Container>
      <Section type="footer" elements={footerElements} embedded={embedded} />
    </Stack>
  );
}

export default ViewContainer;
