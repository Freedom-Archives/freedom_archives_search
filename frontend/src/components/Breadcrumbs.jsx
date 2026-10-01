import Box from "@mui/material/Box";
import Crumbs from "@mui/material/Breadcrumbs";
import Icon from "@mui/material/Icon";
import Typography from "@mui/material/Typography";
import { startCase } from "lodash-es";
import { useMatches } from "react-router";
import { useAppStore } from "src/stores";

// import { useStateValue } from "../appContext";
import Link from "./Link";

function Breadcrumbs() {
  const title = useAppStore((state) => state.title);
  // const { state } = useStateValue();
  const matches = useMatches();
  const path = matches.at(-1);
  let link = "/admin";
  const paths = path.id.split("/").reduce(
    (acc, segment) => {
      let crumb = startCase(segment);
      if (segment.startsWith(":")) {
        const key = segment.slice(1).replace('?', '');
        const param = path.params[key];
        if (param) {
          link += `/${param}`;
          if (key === 'id' && title) {
            crumb = title;
          } else {
            crumb = startCase(param);
          }
        } else {
          return acc;
        }
      } else {
        link += `/${segment}`;
      }
      acc.push({ link, title: crumb });
      return acc;
    }, [])
  // console.log({ location, matches })
  // const parts = location.pathname
  //   .replace(/^\/admin\/?/, "")
  //   .split("/")
  //   .filter(Boolean);

  // const paths = [
  //   { link: "/admin/", title: "Freedom Archives Admin" },
  //   ...parts
  //     .filter((p) => p !== "new" && !p.match(/^\d+$/))
  //     .map((p, index) => {
  //       const link = `${parts.slice(0, index + 1).join("/")}`;
  //       return {
  //         link: routes[link] ? link : null,
  //         title: startCase(p),
  //       };
  //     }),
  // ];

  // if (title && parts.length + 1 !== paths.length) {
  //   paths.push({ link: location.pathname, title });
  // }
  paths.unshift({ link: "/admin/", title: "Freedom Archives Admin" });
  const titleString = paths
    .filter(({ title }) => Boolean(title))
    .map(({ title }) => title)
    .join(" – ");

  return (
    <Box
      sx={{
        flex: "1 1 auto",
        minWidth: 0,
        "& > .MuiTypography-root": {
          color: "white",
        },
        "& > .MuiTypography-root ol": {
          flexWrap: "nowrap",
          flex: "1 1 auto",
        },
        "& > .MuiTypography-root ol li": {
          minWidth: 0,
          flexWrap: "nowrap",
          flex: "0 0 auto",
        },
        "& > .MuiTypography-root ol li:last-child": {
          flex: "1 1 auto",
        },
        "& > .MuiTypography-root ol h6": {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
          flexWrap: "nowrap",
        },
      }}
    >
      <title>{titleString}</title>
      <Crumbs separator={<Icon>navigate_next</Icon>}>
        {paths.map(({ link, title }) => {
          return (
            <Typography variant="h6" key={title}>
              {link ? (
                <Link color="inherit" to={`${link}`}>
                  {title}
                </Link>
              ) : (
                title
              )}
            </Typography>
          );
        })}
      </Crumbs>
    </Box>
  );
}

export default Breadcrumbs;
