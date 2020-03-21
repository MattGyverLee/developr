function rgba(r, g, b, a = 1) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const calcAlpha = depth => {
  switch (depth) {
    case 1:
      return 0.6;
    case 2:
      return 0.4;
    case 3:
      return 0.3;
    case 4:
      return 0.2;
    default:
      return 1;
  }
};

export const getColor = (key, alpha) => {
  var color = "";
  switch (key) {
    case "blue":
      color = rgba(11, 52, 125, alpha);
      break;
    case "red": // #991310
      color = rgba(153, 19, 16, alpha);
      break;
    case "green": // #237f2e;
      color = rgba(35, 127, 46, alpha);
      break;
    case "orange": //
      color = rgba(234, 80, 0, alpha);
      break;
    case "violet":
      color = rgba(97, 5, 139, alpha);
      break;
    case "brown":
      color = rgba(89, 44, 0, alpha);
      break;
    case "teal":
      color = rgba(4, 147, 118, alpha);
      break;
    case "yellow":
      color = rgba(235, 199, 0, alpha);
      break;
    case "fuscia":
      color = rgba(187, 4, 151, alpha);
      break;
    case "avocado":
      color = rgba(193, 194, 96, alpha);
      break;
    case "cyan":
      color = rgba(0, 191, 191, alpha);
      break;
    case "grey":
      color = rgba(124, 124, 124, alpha);
      break;
    default:
      break;
  }

  /* const style = "c" + color.toString() + "-" + intensity.toString();
    const thisColor = colorTable.filter(color => color.label === style)[0]; */
  return color;
};
