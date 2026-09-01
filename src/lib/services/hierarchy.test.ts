import { describe, expect, it } from "vitest";
import {
  PlanLimitError,
  buildStructureTree,
  type StructureNode,
} from "@/lib/services/hierarchy";

function findNode(root: StructureNode, id: string): StructureNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return undefined;
}

function childIds(node: StructureNode) {
  return node.children.map((child) => child.id);
}

describe("PlanLimitError", () => {
  it("stores metric, limit, and message", () => {
    const error = new PlanLimitError(
      "max_sites",
      5,
      "Your current plan allows 5 sites. Upgrade your plan or contact sales.",
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("PlanLimitError");
    expect(error.metric).toBe("max_sites");
    expect(error.limit).toBe(5);
    expect(error.message).toMatch(/5 sites/);
  });

  it("allows a null limit for unlimited-cap messaging edge cases", () => {
    const error = new PlanLimitError("max_projects", null, "Project limit reached.");
    expect(error.limit).toBeNull();
    expect(error.metric).toBe("max_projects");
  });
});

describe("buildStructureTree", () => {
  const structure = {
    businessUnits: [
      { id: "bu-1", name: "Power Division", code: "PWR", status: "active", description: null },
    ],
    regions: [],
    sites: [
      {
        id: "site-bu",
        name: "Substation Alpha",
        code: "SUB-A",
        status: "active",
        business_unit_id: "bu-1",
        region_id: null,
        city: "Pune",
      },
      {
        id: "site-root",
        name: "Head Office",
        code: "HO",
        status: "active",
        business_unit_id: null,
        region_id: null,
        city: "Mumbai",
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "Line Upgrade",
        code: "LU-01",
        status: "active",
        site_id: "site-bu",
        business_unit_id: "bu-1",
      },
      {
        id: "proj-bu-only",
        name: "Division Initiative",
        code: "DI-01",
        status: "planning",
        site_id: null,
        business_unit_id: "bu-1",
      },
    ],
    departments: [
      {
        id: "dept-1",
        name: "EHS",
        code: "EHS",
        status: "active",
        site_id: "site-bu",
        business_unit_id: null,
      },
    ],
    locations: [
      {
        id: "loc-yard",
        name: "Yard",
        code: "YARD",
        status: "active",
        site_id: "site-bu",
        project_id: "proj-1",
        parent_location_id: null,
      },
      {
        id: "loc-bay",
        name: "Bay 3",
        code: "BAY3",
        status: "active",
        site_id: "site-bu",
        project_id: null,
        parent_location_id: "loc-yard",
      },
    ],
  };

  it("builds a nested tree with BUs, sites, projects, departments, and locations", () => {
    const tree = buildStructureTree("Acme EPC", structure);

    expect(tree.kind).toBe("organization");
    expect(tree.label).toBe("Acme EPC");
    expect(childIds(tree)).toEqual(expect.arrayContaining(["bu-1", "site-root"]));

    const bu = findNode(tree, "bu-1")!;
    expect(bu.kind).toBe("business_unit");
    expect(childIds(bu)).toEqual(
      expect.arrayContaining(["site-bu", "proj-bu-only"]),
    );

    const site = findNode(tree, "site-bu")!;
    expect(site.kind).toBe("site");
    expect(childIds(site)).toEqual(
      expect.arrayContaining(["proj-1", "dept-1", "loc-yard"]),
    );

    const project = findNode(tree, "proj-1")!;
    expect(project.kind).toBe("project");
    expect(project.meta).toBe("active");

    const dept = findNode(tree, "dept-1")!;
    expect(dept.kind).toBe("department");

    const yard = findNode(tree, "loc-yard")!;
    expect(yard.kind).toBe("location");
    expect(childIds(yard)).toEqual(["loc-bay"]);

    const bay = findNode(tree, "loc-bay")!;
    expect(bay?.kind).toBe("location");
  });

  it("attaches sites without a business unit directly under the organization root", () => {
    const tree = buildStructureTree("Acme EPC", structure);
    const rootSite = findNode(tree, "site-root");

    expect(rootSite).toBeDefined();
    expect(rootSite!.kind).toBe("site");
    expect(tree.children.some((child) => child.id === "site-root")).toBe(true);
    expect(findNode(tree, "bu-1")!.children.some((child) => child.id === "site-root")).toBe(
      false,
    );
  });

  it("falls back to root when parent references are missing (cross-org orphan handling)", () => {
    const orphanStructure = {
      businessUnits: [],
      regions: [],
      sites: [
        {
          id: "orphan-site",
          name: "Imported Site",
          code: "IMP",
          status: "active",
          business_unit_id: "foreign-bu-id",
          region_id: null,
          city: null,
        },
      ],
      projects: [
        {
          id: "orphan-project",
          name: "Imported Project",
          code: "IP",
          status: "planning",
          site_id: "foreign-site-id",
          business_unit_id: null,
        },
      ],
      departments: [],
      locations: [],
    };

    const tree = buildStructureTree("Acme EPC", orphanStructure);

    expect(childIds(tree)).toEqual(
      expect.arrayContaining(["orphan-site", "orphan-project"]),
    );
    expect(findNode(tree, "orphan-site")!.kind).toBe("site");
    expect(findNode(tree, "orphan-project")!.kind).toBe("project");
  });
});
